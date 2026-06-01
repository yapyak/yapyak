import type {
  ExtractedMessage,
  ExtractFileResult,
  LocaleData,
} from '@yapyak/compiler';
import type { NormalizedYapyakConfig } from '@yapyak/shared';
import type { Plugin, ResolvedConfig, UserConfig } from 'vite';

import {
  autoTranslate,
  detectRenames,
  discoverLocales,
  extractFile,
  migrateLocales,
  readLocaleData,
  syncLocaleFiles,
  transformFile,
  walkSourceFiles,
} from '@yapyak/compiler';
import { createFilter, loadYapyakConfig } from '@yapyak/config';
import { defineRuntime } from '@yapyak/shared';

import { readFileSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';

const RUNTIME_ID = '@yapyak/shared';
const RUNTIME_RESOLVED = `\0${RUNTIME_ID}`;
const RUNTIME_NO_EXTERNAL: (string | RegExp)[] = ['yapyak', /^@yapyak\//];

function isRuntimeExternal(id: string): boolean {
  return RUNTIME_NO_EXTERNAL.some((pattern) =>
    typeof pattern === 'string' ? pattern === id : pattern.test(id),
  );
}

const HMR_LISTENER = [
  'if (import.meta.hot) {',
  "  import.meta.hot.on('yapyak:locale-added', (data) => {",
  "    console.log(`[yapyak] New locale '${data.locale}' detected. ${data.hint}`);",
  '  });',
  "  import.meta.hot.on('yapyak:locale-removed', (data) => {",
  "    console.log(`[yapyak] Locale '${data.locale}' removed.`);",
  '  });',
  '}',
].join('\n');

interface CallSitePosition {
  column: number;
  line: number;
  source: string;
}

/**
 * Options for {@link yapyak}.
 */
export interface YapyakOptions {
  /**
   * Locks the build to a single locale. Stripped at compile time.
   *
   * @remarks
   * When set, every `t()` and `t.at()` call is rewritten to the matching translation literal for this locale, the `_pick` runtime is tree-shaken away, and the resulting bundle contains zero i18n overhead. Useful for static SPA deploys where each artifact serves one locale.
   *
   * Must be one of the locales configured in the project (i.e., a `<locale>.json` file under the locales directory). Throws at config-resolution time if not.
   *
   * Leave unset (or use `process.env.YAPYAK_LOCALE` for CI control) to keep the default multi-locale behavior where every call site emits a catalog of all available locales.
   *
   * @example Per-build static locale via CI
   * ```ts
   * import { yapyak } from '@yapyak/vite';
   * import { defineConfig } from 'vite';
   *
   * export default defineConfig({
   *   plugins: [yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })],
   * });
   * ```
   */
  fixedLocale?: string;
}

/**
 * Creates a Vite plugin.
 *
 * @remarks
 * Configuration is read from `yapyak.config.{ts,mts,mjs,js}` in the project root. Returns defaults if no config file is found.
 *
 * @param options - The plugin options.
 *
 * @example Register in vite.config.ts
 * ```ts
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak()],
 * });
 * ```
 *
 * @example Lock the build to a single locale
 * ```ts
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })],
 * });
 * ```
 */
export function yapyak(options: YapyakOptions = {}): Plugin {
  const fixedLocale =
    options.fixedLocale && options.fixedLocale.length > 0
      ? options.fixedLocale
      : undefined;
  const messagesByFile = new Map<string, ExtractedMessage[]>();
  let projectRoot = process.cwd();
  let cacheDir: string | undefined;
  let localeCache: LocaleData | null = null;
  let resolved: { defaultLocale: string; locales: string[] } | null = null;
  let normalized: NormalizedYapyakConfig | null = null;
  let filter: (path: string) => boolean = () => false;
  let configFile: string | null = null;
  let command: 'build' | 'serve' = 'serve';
  let logger: ResolvedConfig['logger'] | null = null;
  const teardownCallbacks: Array<() => void> = [];

  function getNormalized(): NormalizedYapyakConfig {
    if (normalized === null) {
      throw new Error(
        '[yapyak] plugin used before configResolved — config is not loaded yet.',
      );
    }
    return normalized;
  }

  function discover(): { defaultLocale: string; locales: string[] } {
    const config = getNormalized();
    if (resolved === null) {
      const base = discoverLocales({
        defaultLocale: config.defaultLocale,
        localesDir: config.localesDir,
        projectRoot,
      });
      if (fixedLocale !== undefined) {
        resolved = {
          defaultLocale: base.defaultLocale,
          locales: [fixedLocale],
        };
      } else {
        resolved = base;
      }
    }
    return resolved;
  }

  function getLocaleData(): LocaleData {
    if (localeCache === null) {
      localeCache = readLocaleData({
        locales: discover().locales,
        localesDir: getNormalized().localesDir,
        projectRoot,
      });
    }
    return localeCache;
  }

  function syncAll(): void {
    const allMessages: ExtractedMessage[] = [];
    for (const list of messagesByFile.values()) {
      allMessages.push(...list);
    }
    const { defaultLocale, locales } = discover();
    syncLocaleFiles({
      cacheDir,
      defaultLocale,
      locales,
      localesDir: getNormalized().localesDir,
      messages: allMessages,
      projectRoot,
    });
    localeCache = null;
  }

  function scanAllSources(): void {
    const files = walkSourceFiles({ filter, projectRoot });
    const { locales } = discover();
    messagesByFile.clear();
    for (const file of files) {
      const result = extractFile({
        fileId: file.fileId,
        locales,
        source: file.code,
      });
      logErrors(result, error);
      if (result.messages.length > 0) {
        messagesByFile.set(file.fileId, result.messages);
      }
    }
    syncAll();
  }

  function fillStubs(): void {
    const config = getNormalized();
    const translator = config.translator;
    if (!translator) {
      return;
    }
    if (config.autoTranslateThreshold <= 0) {
      return;
    }
    const allMessages: ExtractedMessage[] = [];
    for (const list of messagesByFile.values()) {
      allMessages.push(...list);
    }
    if (allMessages.length === 0) {
      return;
    }
    const { defaultLocale, locales } = discover();
    const missing = discoverMissingSources(
      allMessages,
      locales,
      defaultLocale,
      getLocaleData(),
    );
    if (missing.size === 0) {
      return;
    }
    if (missing.size > config.autoTranslateThreshold) {
      info(
        `[yapyak] ${missing.size} new strings detected. Run \`${runYapyakCommand('translate')}\` to fill.`,
      );
      return;
    }
    const filtered = allMessages.filter((message) =>
      missing.has(message.source),
    );
    void autoTranslate({
      defaultLocale,
      locales,
      localesDir: config.localesDir,
      messages: filtered,
      projectRoot,
      translator,
    })
      .then((result) => {
        if (result.translated > 0) {
          localeCache = null;
        }
        for (const error of result.errors) {
          warn(
            `[yapyak] translation failed: ${error.locale} ${error.fileId} "${error.source}" ${String(error.error)}`,
          );
        }
      })
      .catch((error: unknown) => {
        warn(`[yapyak] auto-translate error: ${String(error)}`);
      });
  }

  function info(message: string): void {
    if (logger !== null) {
      logger.info(message);
      return;
    }
    console.log(message);
  }

  function warn(message: string): void {
    if (logger !== null) {
      logger.warn(message);
      return;
    }
    console.warn(message);
  }

  function error(message: string): void {
    if (logger !== null) {
      logger.error(message);
      return;
    }
    console.error(message);
  }

  return {
    buildEnd(): void {
      for (const cancel of teardownCallbacks) {
        cancel();
      }
      teardownCallbacks.length = 0;
    },
    buildStart(): void {
      if (command === 'build') {
        return;
      }
      scanAllSources();
      fillStubs();
    },
    config(): UserConfig {
      return {
        optimizeDeps: {
          exclude: [RUNTIME_ID],
        },
        ssr: {
          noExternal: RUNTIME_NO_EXTERNAL,
        },
      };
    },
    async configResolved(config: ResolvedConfig): Promise<void> {
      projectRoot = config.root;
      cacheDir =
        typeof config.cacheDir === 'string'
          ? join(config.cacheDir, 'yapyak')
          : undefined;
      command = config.command;
      logger = config.logger ?? null;
      const result = await loadYapyakConfig(projectRoot);
      normalized = result.config;
      configFile = result.configFile;
      filter = createFilter(result.config.include, result.config.exclude);
      const ssrExternal = config.ssr?.external;
      if (Array.isArray(ssrExternal)) {
        const kept = ssrExternal.filter((id) => !isRuntimeExternal(id));
        ssrExternal.splice(0, ssrExternal.length, ...kept);
      }
      if (fixedLocale !== undefined) {
        const available = discoverLocales({
          defaultLocale: result.config.defaultLocale,
          localesDir: result.config.localesDir,
          projectRoot,
        }).locales;
        if (!available.includes(fixedLocale)) {
          throw new Error(
            `[yapyak] fixedLocale '${fixedLocale}' is not configured in this project. ` +
              `Available locales: ${available.join(', ')}. ` +
              `Either add '${fixedLocale}' to your locales/ directory or pick an existing locale.`,
          );
        }
      }
    },
    configureServer(server): void {
      if (configFile !== null) {
        server.watcher.add(configFile);
      }

      const pending = new Map<string, 'add' | 'unlink'>();
      const flush = debounce(() => {
        if (pending.size === 0) {
          return;
        }
        const { locales } = discover();
        for (const [fileId, kind] of pending) {
          if (kind === 'unlink') {
            messagesByFile.delete(fileId);
            continue;
          }
          let code: string;
          try {
            code = readFileSync(join(projectRoot, fileId), 'utf8');
          } catch {
            messagesByFile.delete(fileId);
            continue;
          }
          const result = extractFile({ fileId, locales, source: code });
          logErrors(result, error);
          if (result.messages.length > 0) {
            messagesByFile.set(fileId, result.messages);
          } else {
            messagesByFile.delete(fileId);
          }
        }
        pending.clear();
        syncAll();
        fillStubs();
      }, 50);
      teardownCallbacks.push(flush.cancel);

      const isLocaleFile = (path: string): boolean => {
        const dir = join(projectRoot, getNormalized().localesDir);
        const rel = relative(dir, path);
        if (rel === '' || rel.startsWith('..') || rel.includes(sep)) {
          return false;
        }
        return extname(rel) === '.json';
      };

      const localeFromPath = (path: string): string => {
        const base = basename(path);
        return base.slice(0, -extname(base).length);
      };

      const reloadCandidateModules = (): void => {
        for (const mod of server.moduleGraph.idToModuleMap.values()) {
          if (mod.file !== null && isCandidateId(mod.file, filter)) {
            void server.reloadModule(mod);
          }
        }
      };

      const reloadRuntimeModule = (): void => {
        const runtimeMod = server.moduleGraph.getModuleById(RUNTIME_RESOLVED);
        if (runtimeMod) {
          void server.reloadModule(runtimeMod);
        }
      };

      const invalidateLocaleData = debounce(() => {
        localeCache = null;
        reloadCandidateModules();
      }, 50);
      teardownCallbacks.push(invalidateLocaleData.cancel);

      const syncLocaleStructure = debounce(() => {
        resolved = null;
        localeCache = null;
        const { defaultLocale, locales } = discover();
        const allMessages: ExtractedMessage[] = [];
        for (const list of messagesByFile.values()) {
          allMessages.push(...list);
        }
        syncLocaleFiles({
          cacheDir,
          defaultLocale,
          locales,
          localesDir: getNormalized().localesDir,
          messages: allMessages,
          projectRoot,
        });
        reloadRuntimeModule();
        reloadCandidateModules();
      }, 50);
      teardownCallbacks.push(syncLocaleStructure.cancel);

      server.watcher.on('change', (path: string) => {
        if (configFile !== null && path === configFile) {
          void server.restart();
          return;
        }
        if (isLocaleFile(path)) {
          invalidateLocaleData();
        }
      });

      server.watcher.on('add', (path: string) => {
        if (isCandidateId(path, filter)) {
          pending.set(toFileId(projectRoot, path), 'add');
          flush();
          return;
        }
        if (isLocaleFile(path)) {
          const locale = localeFromPath(path);
          const hint = `Run \`${runYapyakCommand(`translate ${locale}`)}\` to fill the stubs.`;
          syncLocaleStructure();
          info(`[yapyak] New locale '${locale}' detected. ${hint}`);
          server.ws.send({
            data: { hint, locale },
            event: 'yapyak:locale-added',
            type: 'custom',
          });
        }
      });

      server.watcher.on('unlink', (path: string) => {
        if (isCandidateId(path, filter)) {
          pending.set(toFileId(projectRoot, path), 'unlink');
          flush();
          return;
        }
        if (isLocaleFile(path)) {
          const locale = localeFromPath(path);
          syncLocaleStructure();
          info(`[yapyak] Locale '${locale}' removed.`);
          server.ws.send({
            data: { locale },
            event: 'yapyak:locale-removed',
            type: 'custom',
          });
        }
      });
    },
    enforce: 'pre',
    async handleHotUpdate(ctx): Promise<void> {
      if (!isCandidateId(ctx.file, filter)) {
        return;
      }
      const fileId = toFileId(projectRoot, ctx.file);
      const code = await ctx.read();
      const { defaultLocale, locales } = discover();
      const result = extractFile({ fileId, locales, source: code });
      logErrors(result, error);
      const before = messagesByFile.get(fileId) ?? [];
      const after = result.messages;
      if (areMessagesEqual(before, after)) {
        return;
      }
      const renames = detectRenames(
        before.flatMap(toCallSitePositions),
        after.flatMap(toCallSitePositions),
      );
      if (renames.length > 0) {
        migrateLocales({
          defaultLocale,
          extractedSources: toExtractedSourcesForFile(fileId, after),
          fileId,
          locales,
          localesDir: getNormalized().localesDir,
          preserveTranslations: getNormalized().preserveTranslationsOnRename,
          projectRoot,
          renames,
        });
        localeCache = null;
      }
      if (after.length === 0) {
        messagesByFile.delete(fileId);
      } else {
        messagesByFile.set(fileId, after);
      }
      syncAll();
      fillStubs();
    },
    load(id: string): string | null {
      if (id === RUNTIME_RESOLVED) {
        const normalized = getNormalized();
        const resolved = discover();
        const runtime = defineRuntime({
          defaultLocale: resolved.defaultLocale,
          detectAcceptLanguage: normalized.detectAcceptLanguage,
          locales: resolved.locales,
          persistence: normalized.persistence,
          syncHtmlLang: normalized.syncHtmlLang,
        });
        return `${runtime}\n${HMR_LISTENER}`;
      }
      return null;
    },
    name: 'yapyak',
    resolveId(id: string): string | null {
      if (id === RUNTIME_ID) {
        return RUNTIME_RESOLVED;
      }
      return null;
    },
    transform(code: string, id: string): { code: string } | null {
      if (!isCandidateId(id, filter)) {
        return null;
      }
      const fileId = toFileId(projectRoot, id);
      const { locales } = discover();
      const extracted = extractFile({ fileId, locales, source: code });
      logErrors(extracted, error);
      if (extracted.callSites.length === 0) {
        return null;
      }
      const translations = buildTranslations({
        extracted,
        fileId,
        localeData: getLocaleData(),
        locales,
      });
      const result = transformFile({
        defaultLocale: discover().defaultLocale,
        extracted,
        fileId,
        locales,
        source: code,
        translations,
      });
      if (result.code === code) {
        return null;
      }
      return { code: result.code };
    },
  };
}

function buildTranslations(input: {
  extracted: ExtractFileResult;
  fileId: string;
  localeData: LocaleData;
  locales: readonly string[];
}): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {};
  for (const message of input.extracted.messages) {
    for (const locale of input.locales) {
      const localeFile = input.localeData[locale];
      const fileEntries = localeFile?.[input.fileId];
      const value = fileEntries?.[message.source];
      if (typeof value !== 'string' || value === '') {
        continue;
      }
      let localeMap = translations[locale];
      if (!localeMap) {
        localeMap = {};
        translations[locale] = localeMap;
      }
      localeMap[message.id] = value;
    }
  }
  return translations;
}

function discoverMissingSources(
  messages: ExtractedMessage[],
  locales: readonly string[],
  defaultLocale: string,
  data: LocaleData,
): Set<string> {
  const missing = new Set<string>();
  for (const message of messages) {
    if (missing.has(message.source)) {
      continue;
    }
    let flagged = false;
    for (const locale of locales) {
      if (locale === defaultLocale) {
        continue;
      }
      const localeFile = data[locale];
      for (const location of message.locations) {
        const existing = localeFile?.[location.fileId]?.[message.source];
        if (typeof existing !== 'string' || existing === '') {
          missing.add(message.source);
          flagged = true;
          break;
        }
      }
      if (flagged) {
        break;
      }
    }
  }
  return missing;
}

function toCallSitePositions(message: ExtractedMessage): CallSitePosition[] {
  return message.locations.map((location) => ({
    column: location.range.start.column,
    line: location.range.start.line,
    source: message.source,
  }));
}

function toExtractedSourcesForFile(
  fileId: string,
  messages: ExtractedMessage[],
): Record<string, Set<string>> {
  const sources = new Set<string>();
  for (const message of messages) {
    sources.add(message.source);
  }
  return { [fileId]: sources };
}

function isCandidateId(id: string, filter: (id: string) => boolean): boolean {
  if (id.startsWith('\0')) {
    return false;
  }
  const path = id.split('?')[0] ?? id;
  return filter(path);
}

function runYapyakCommand(args: string): string {
  const ua = process.env.npm_config_user_agent ?? '';
  if (ua.startsWith('pnpm/')) {
    return `pnpm yapyak ${args}`;
  }
  if (ua.startsWith('yarn/')) {
    return `yarn yapyak ${args}`;
  }
  if (ua.startsWith('bun/')) {
    return `bunx yapyak ${args}`;
  }
  return `npx yapyak ${args}`;
}

function toFileId(projectRoot: string, id: string): string {
  const path = id.split('?')[0] ?? id;
  return relative(projectRoot, path).replaceAll('\\', '/');
}

function areMessagesEqual(
  a: ExtractedMessage[],
  b: ExtractedMessage[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) {
      return false;
    }
    if (
      left.id !== right.id ||
      left.locations.length !== right.locations.length
    ) {
      return false;
    }
    for (let j = 0; j < left.locations.length; j++) {
      const ll = left.locations[j];
      const rl = right.locations[j];
      if (!ll || !rl) {
        return false;
      }
      if (
        ll.range.start.line !== rl.range.start.line ||
        ll.range.start.column !== rl.range.start.column
      ) {
        return false;
      }
    }
  }
  return true;
}

function logErrors(
  result: ExtractFileResult,
  emit: (message: string) => void,
): void {
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity !== 'error') {
      continue;
    }
    const { fileId, range, code, message } = diagnostic;
    emit(
      `[yapyak] ${code} ${fileId}:${range.start.line}:${range.start.column}: ${message}`,
    );
  }
}

interface Debounced {
  cancel(): void;
  (): void;
}

function debounce(fn: () => void, ms: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, ms);
  }) as Debounced;
  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return debounced;
}
