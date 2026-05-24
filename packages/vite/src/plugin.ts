import type { ExtractedMessage, LocaleData } from '@yapyak/compiler';
import type { Plugin, ResolvedConfig } from 'vite';
import type { YapyakOptions } from './options';

import {
  autoTranslate,
  DynamicMessageError,
  detectRenames,
  discoverLocales,
  extractMessages,
  migrateLocales,
  readLocaleData,
  syncLocaleFiles,
  walkSourceFiles,
} from '@yapyak/compiler';
import { createFilter } from 'vite';

import { normalizeOptions } from './options';
import { transformSource } from './transform-source';
import { relative } from 'node:path';

const CONFIG_ID = 'virtual:yapyak';
const CONFIG_RESOLVED = `\0${CONFIG_ID}`;

/**
 * Creates the yapyak Vite plugin.
 *
 * @remarks
 * Extracts {@link $t} calls at build time, syncs locale files, optionally fills
 * missing translations through a {@link Translator}, and emits per-locale chunks
 * that are lazy-loaded by the runtime — so the default locale costs zero
 * extra bytes and non-default locales ship as separate chunks.
 *
 * @param options - The plugin options.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import { yapyak } from '@yapyak/vite';
 * import { anthropic } from '@yapyak/anthropic';
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
      if (areMessagesEqual(before, after)) {
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
      const messages = extractMessages({ code, fileId });
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
      if (!result.changed) {
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
    `export const PERSISTENCE = ${JSON.stringify(serializePersistence(normalized.persistence))};`,
  );
  lines.push(
    `export const DETECT_ACCEPT_LANGUAGE = ${JSON.stringify(normalized.detectAcceptLanguage)};`,
  );
  lines.push(
    `export const SYNC_HTML_LANG = ${JSON.stringify(normalized.syncHtmlLang)};`,
  );
  return lines.join('\n');
}

function serializePersistence(
  persistence: ReturnType<typeof normalizeOptions>['persistence'],
):
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: { flags: string; source: string } }
  | null {
  if (persistence === null) {
    return null;
  }
  if (persistence.type !== 'url') {
    return persistence;
  }
  if (persistence.match === undefined) {
    return { type: 'url' };
  }
  return {
    match: { flags: persistence.match.flags, source: persistence.match.source },
    type: 'url',
  };
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
      left.source !== right.source ||
      left.line !== right.line ||
      left.column !== right.column
    ) {
      return false;
    }
  }
  return true;
}
