import { relative } from 'node:path';
import { createFilter, type Plugin, type ResolvedConfig } from 'vite';
import { autoTranslate } from './auto-translate.js';
import { detectRenames } from './detect-renames.js';
import { discoverLocales } from './discover-locales.js';
import {
  DynamicMessageError,
  type ExtractedMessage,
  extractMessages,
} from './extract-messages.js';
import { migrateLocales } from './migrate-locales.js';
import {
  normalizeOptions,
  type YapyakOptions,
} from './normalize-options.js';
import { readLocaleData } from './read-locale-data.js';
import { syncLocaleFiles } from './sync-locale-files.js';
import { transformSource } from './transform-source.js';
import type { LocaleData } from './transform-source.js';
import { walkSourceFiles } from './walk-source-files.js';

export type { YapyakOptions };

const SETUP_ID = 'virtual:yapyak/setup';
const SETUP_RESOLVED = `\0${SETUP_ID}`;

/**
 * The yapyak Vite plugin.
 *
 * Extracts `t()` calls at build time, syncs locale files, optionally fills
 * missing translations through an AI translator, and inlines variants at
 * each call site.
 *
 * @param options - Plugin options.
 * @returns A Vite plugin.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import { yapyak } from 'yapyak/vite';
 * import { anthropic } from 'yapyak/translators/anthropic';
 *
 * export default defineConfig({
 *   plugins: [
 *     yapyak({
 *       defaultLocale: 'en',
 *       translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
 *     }),
 *   ],
 * });
 * ```
 */
export function yapyak(options: YapyakOptions = {}): Plugin {
  const normalized = normalizeOptions(options);
  const filter = createFilter(normalized.include, normalized.exclude);
  const messagesByFile = new Map<string, ExtractedMessage[]>();
  let projectRoot = process.cwd();
  let localeCache: LocaleData | null = null;
  let resolved: { defaultLocale: string; locales: string[] } | null = null;

  function discover(): { defaultLocale: string; locales: string[] } {
    if (resolved === null) {
      resolved = discoverLocales({
        defaultLocale: normalized.defaultLocale,
        localesDir: normalized.localesDir,
        projectRoot,
      });
    }
    return resolved;
  }

  function getLocaleData(): LocaleData {
    if (localeCache === null) {
      localeCache = readLocaleData({
        locales: discover().locales,
        localesDir: normalized.localesDir,
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
      localesDir: normalized.localesDir,
      messages: allMessages,
      projectRoot,
    });
    localeCache = null;
  }

  function scanAllSources(): void {
    const files = walkSourceFiles({
      filter,
      projectRoot,
    });
    messagesByFile.clear();
    for (const file of files) {
      try {
        const messages = extractMessages({
          code: file.code,
          fileId: file.fileId,
        });
        if (messages.length > 0) {
          messagesByFile.set(file.fileId, messages);
        }
      } catch (error) {
        if (error instanceof DynamicMessageError) {
          // biome-ignore lint/suspicious/noConsole: dev plugin output
          console.error(error.message);
          continue;
        }
        throw error;
      }
    }
    syncAll();
  }

  function fillStubs(): void {
    const translator = normalized.translator;
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
      localesDir: normalized.localesDir,
      messages: allMessages,
      projectRoot,
      translator,
    })
      .then((result) => {
        if (result.translated > 0) {
          localeCache = null;
        }
        for (const error of result.errors) {
          // biome-ignore lint/suspicious/noConsole: dev plugin output
          console.warn(
            `[yapyak] translation failed: ${error.locale} ${error.fileId} "${error.source}"`,
            error.error,
          );
        }
      })
      .catch((error: unknown) => {
        // biome-ignore lint/suspicious/noConsole: dev plugin output
        console.warn('[yapyak] auto-translate error:', error);
      });
  }

  return {
    name: 'yapyak',
    enforce: 'pre',
    api: {
      yapyak: {
        defaultLocale: normalized.defaultLocale,
        localesDir: normalized.localesDir,
      },
    },
    configResolved(config: ResolvedConfig): void {
      projectRoot = config.root;
    },
    buildStart(): void {
      scanAllSources();
      fillStubs();
    },
    resolveId(id: string): string | null {
      if (id === SETUP_ID) {
        return SETUP_RESOLVED;
      }
      return null;
    },
    load(id: string): string | null {
      if (id === SETUP_RESOLVED) {
        return generateSetup(normalized, discover());
      }
      return null;
    },
    transform(code: string, id: string): { code: string } | null {
      if (!isCandidateId(id, filter)) {
        return null;
      }
      const fileId = toFileId(projectRoot, id);
      let messages: ExtractedMessage[];
      try {
        messages = extractMessages({ code, fileId });
      } catch (error) {
        if (error instanceof DynamicMessageError) {
          throw error;
        }
        throw error;
      }
      if (messages.length === 0) {
        return null;
      }
      const { defaultLocale, locales } = discover();
      const result = transformSource(code, {
        defaultLocale,
        fileId,
        localeData: getLocaleData(),
        locales,
      });
      if (result === null) {
        return null;
      }
      return { code: result.code };
    },
    transformIndexHtml(): Array<{
      tag: string;
      attrs: Record<string, string | boolean>;
      injectTo: 'head-prepend';
    }> {
      return [
        {
          attrs: {
            src: `/@id/${SETUP_ID}`,
            type: 'module',
          },
          injectTo: 'head-prepend',
          tag: 'script',
        },
      ];
    },
    async handleHotUpdate(ctx): Promise<void> {
      if (!isCandidateId(ctx.file, filter)) {
        return;
      }
      const fileId = toFileId(projectRoot, ctx.file);
      const code = await ctx.read();
      const before = messagesByFile.get(fileId) ?? [];
      let after: ExtractedMessage[];
      try {
        after = extractMessages({ code, fileId });
      } catch (error) {
        if (error instanceof DynamicMessageError) {
          // biome-ignore lint/suspicious/noConsole: dev plugin output
          console.error(error.message);
          return;
        }
        throw error;
      }
      if (messagesEqual(before, after)) {
        return;
      }

      const { defaultLocale, locales } = discover();
      const renames = detectRenames(
        before.map(toPosition),
        after.map(toPosition),
      );
      if (renames.length > 0) {
        migrateLocales({
          defaultLocale,
          fileId,
          locales,
          localesDir: normalized.localesDir,
          preserveTranslations: normalized.preserveTranslationsOnRename,
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
  };
}

function toPosition(message: ExtractedMessage): {
  column: number;
  line: number;
  source: string;
} {
  return {
    column: message.column,
    line: message.line,
    source: message.source,
  };
}

function generateSetup(
  normalized: ReturnType<typeof normalizeOptions>,
  resolved: { defaultLocale: string; locales: string[] },
): string {
  const lines: string[] = [];
  lines.push(`import { configureLocale } from 'yapyak';`);
  lines.push(`configureLocale(${JSON.stringify({
    acceptLanguage: normalized.acceptLanguage,
    cookieName: normalized.cookieName,
    defaultLocale: resolved.defaultLocale,
    locales: resolved.locales,
    persistence: normalized.persistence,
    storageKey: normalized.storageKey,
  })});`);
  return lines.join('\n');
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

function messagesEqual(
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
      left.source !== right.source ||
      left.line !== right.line ||
      left.column !== right.column ||
      left.fixedLocale !== right.fixedLocale
    ) {
      return false;
    }
  }
  return true;
}
