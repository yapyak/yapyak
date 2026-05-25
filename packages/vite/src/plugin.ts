import type { LocaleData } from '@yapyak/compiler';
import type {
  ExtractedMessage,
  ExtractFileResult,
} from '@yapyak/compiler/internal';
import type { NormalizedYapyakConfig } from '@yapyak/config/internal';
import type { PersistenceConfig } from '@yapyak/core/internal';
import type { Plugin, ResolvedConfig } from 'vite';

import {
  autoTranslate,
  detectRenames,
  discoverLocales,
  migrateLocales,
  readLocaleData,
  syncLocaleFiles,
} from '@yapyak/compiler';
import {
  extractFile,
  transformFile,
  walkSourceFiles,
} from '@yapyak/compiler/internal';
import { createFilter, loadYapyakConfig } from '@yapyak/config/internal';

import { relative } from 'node:path';

const CONFIG_ID = 'virtual:yapyak';
const CONFIG_RESOLVED = `\0${CONFIG_ID}`;

interface CallSitePosition {
  column: number;
  line: number;
  source: string;
}

/**
 * Creates a yapyak Vite plugin.
 *
 * @remarks
 * Reads configuration from `yapyak.config.{ts,mts,mjs,js}` in the project root. Returns defaults if no config file is found.
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
 */
export function yapyak(): Plugin {
  const messagesByFile = new Map<string, ExtractedMessage[]>();
  let projectRoot = process.cwd();
  let localeCache: LocaleData | null = null;
  let resolved: { defaultLocale: string; locales: string[] } | null = null;
  let normalized: NormalizedYapyakConfig | null = null;
  let filter: (path: string) => boolean = () => false;

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
      resolved = discoverLocales({
        defaultLocale: config.defaultLocale,
        localesDir: config.localesDir,
        projectRoot,
      });
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
      logErrors(result);
      if (result.messages.length > 0) {
        messagesByFile.set(file.fileId, result.messages);
      }
    }
    syncAll();
  }

  function fillStubs(): void {
    const translator = getNormalized().translator;
    if (translator === undefined) {
      return;
    }
    const allMessages: ExtractedMessage[] = [];
    for (const list of messagesByFile.values()) {
      allMessages.push(...list);
    }
    const { defaultLocale, locales } = discover();
    void autoTranslate({
      defaultLocale,
      locales,
      localesDir: getNormalized().localesDir,
      messages: allMessages,
      projectRoot,
      translator,
    })
      .then((result) => {
        if (result.translated > 0) {
          localeCache = null;
        }
        for (const error of result.errors) {
          console.warn(
            `[yapyak] translation failed: ${error.locale} ${error.fileId} "${error.source}"`,
            error.error,
          );
        }
      })
      .catch((error: unknown) => {
        console.warn('[yapyak] auto-translate error:', error);
      });
  }

  return {
    buildStart(): void {
      scanAllSources();
      fillStubs();
    },
    async configResolved(config: ResolvedConfig): Promise<void> {
      projectRoot = config.root;
      const { config: loaded } = await loadYapyakConfig(projectRoot);
      normalized = loaded;
      filter = createFilter(loaded.include, loaded.exclude);
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
      logErrors(result);
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
      if (id === CONFIG_RESOLVED) {
        return generateConfig(getNormalized(), discover());
      }
      return null;
    },
    name: 'yapyak',
    resolveId(id: string): string | null {
      if (id === CONFIG_ID) {
        return CONFIG_RESOLVED;
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
      logErrors(extracted);
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
      if (localeMap === undefined) {
        localeMap = {};
        translations[locale] = localeMap;
      }
      localeMap[message.id] = value;
    }
  }
  return translations;
}

function toCallSitePositions(message: ExtractedMessage): CallSitePosition[] {
  return message.locations.map((location) => ({
    column: location.range.start.column,
    line: location.range.start.line,
    source: message.source,
  }));
}

function generateConfig(
  normalized: NormalizedYapyakConfig,
  resolved: { defaultLocale: string; locales: string[] },
): string {
  const lines: string[] = [];
  lines.push(`export const LOCALES = ${JSON.stringify(resolved.locales)};`);
  lines.push(
    `export const DEFAULT_LOCALE = ${JSON.stringify(resolved.defaultLocale)};`,
  );
  lines.push(
    `export const PERSISTENCE = ${emitPersistence(normalized.persistence)};`,
  );
  lines.push(
    `export const DETECT_ACCEPT_LANGUAGE = ${JSON.stringify(normalized.detectAcceptLanguage)};`,
  );
  lines.push(
    `export const SYNC_HTML_LANG = ${JSON.stringify(normalized.syncHtmlLang)};`,
  );
  return lines.join('\n');
}

function emitPersistence(persistence: PersistenceConfig): string {
  if (persistence === null) {
    return 'null';
  }
  if (persistence.type === 'cookie') {
    return `{ type: 'cookie', name: ${JSON.stringify(persistence.name)} }`;
  }
  if (persistence.type === 'localStorage') {
    return `{ type: 'localStorage', key: ${JSON.stringify(persistence.key)} }`;
  }
  if (persistence.match === undefined) {
    return `{ type: 'url' }`;
  }
  return `{ type: 'url', match: new RegExp(${JSON.stringify(persistence.match.source)}, ${JSON.stringify(persistence.match.flags)}) }`;
}

function isCandidateId(id: string, filter: (id: string) => boolean): boolean {
  if (id.startsWith('\0')) {
    return false;
  }
  const path = id.split('?')[0] ?? id;
  return filter(path);
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
    if (left === undefined || right === undefined) {
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
      if (ll === undefined || rl === undefined) {
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

function logErrors(result: ExtractFileResult): void {
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity !== 'error') {
      continue;
    }
    const { fileId, range, code, message } = diagnostic;
    console.error(
      `[yapyak] ${code} ${fileId}:${range.start.line}:${range.start.column}: ${message}`,
    );
  }
}
