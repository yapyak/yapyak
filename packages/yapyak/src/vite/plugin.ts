import type { Plugin, ResolvedConfig } from 'vite';
import type { ExtractedMessage } from './extract-messages.ts';
import type { YapyakOptions } from './normalize-options.ts';
import type { LocaleData } from './transform-source.ts';

import { createFilter } from 'vite';

import { autoTranslate } from './auto-translate.ts';
import { detectRenames } from './detect-renames.ts';
import { discoverLocales } from './discover-locales.ts';
import { DynamicMessageError, extractMessages } from './extract-messages.ts';
import { migrateLocales } from './migrate-locales.ts';
import { normalizeOptions } from './normalize-options.ts';
import { readLocaleData } from './read-locale-data.ts';
import { syncLocaleFiles } from './sync-locale-files.ts';
import { transformSource } from './transform-source.ts';
import { walkSourceFiles } from './walk-source-files.ts';
import { relative } from 'node:path';

export type { YapyakOptions };

const CONFIG_ID = 'virtual:yapyak';
const CONFIG_RESOLVED = `\0${CONFIG_ID}`;

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
 * import { anthropic } from 'yapyak/translator';
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
    api: {
      yapyak: {
        defaultLocale: normalized.defaultLocale,
        localesDir: normalized.localesDir,
      },
    },
    buildStart(): void {
      scanAllSources();
      fillStubs();
    },
    configResolved(config: ResolvedConfig): void {
      projectRoot = config.root;
    },
    enforce: 'pre',
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
    load(id: string): string | null {
      if (id === CONFIG_RESOLVED) {
        return generateConfig(normalized, discover());
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

function generateConfig(
  normalized: ReturnType<typeof normalizeOptions>,
  resolved: { defaultLocale: string; locales: string[] },
): string {
  const lines: string[] = [];
  lines.push(`export const LOCALES = ${JSON.stringify(resolved.locales)};`);
  lines.push(
    `export const DEFAULT_LOCALE = ${JSON.stringify(resolved.defaultLocale)};`,
  );
  lines.push(
    `export const PERSISTENCE = ${JSON.stringify(normalized.persistence)};`,
  );
  lines.push(
    `export const ACCEPT_LANGUAGE = ${JSON.stringify(normalized.acceptLanguage)};`,
  );
  lines.push(
    `export const SYNC_HTML_LANG = ${JSON.stringify(normalized.syncHtmlLang)};`,
  );
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

function messagesEqual(a: ExtractedMessage[], b: ExtractedMessage[]): boolean {
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
