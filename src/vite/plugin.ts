import { relative } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { autoTranslate } from './auto-translate.js';
import { discoverLocales } from './discover-locales.js';
import {
  type ExtractedSchema,
  extractSchemas,
} from './extract-schemas.js';
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

const SOURCE_PATTERN = /\.(?:tsx?|jsx?|mjs|cjs|mts|cts)$/;
const SETUP_ID = 'virtual:yapyak/setup';
const SETUP_RESOLVED = `\0${SETUP_ID}`;

export function yapyak(options: YapyakOptions): Plugin {
  const normalized = normalizeOptions(options);
  const schemasByFile = new Map<string, ExtractedSchema[]>();
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
    const allSchemas: ExtractedSchema[] = [];
    for (const list of schemasByFile.values()) {
      allSchemas.push(...list);
    }
    const { defaultLocale, locales } = discover();
    syncLocaleFiles({
      defaultLocale,
      locales,
      localesDir: normalized.localesDir,
      projectRoot,
      schemas: allSchemas,
    });
    localeCache = null;
  }

  function scanAllSources(): void {
    const files = walkSourceFiles({
      pattern: SOURCE_PATTERN,
      projectRoot,
      roots: ['src'],
    });
    schemasByFile.clear();
    for (const file of files) {
      const schemas = extractSchemas(file.code, file.fileId);
      if (schemas.length > 0) {
        schemasByFile.set(file.fileId, schemas);
      }
    }
    syncAll();
  }

  function fillStubs(): void {
    const translator = normalized.translator;
    if (translator === undefined) {
      return;
    }
    const { defaultLocale, locales } = discover();
    void autoTranslate({
      defaultLocale,
      locales,
      localesDir: normalized.localesDir,
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
            `[yapyak] translation failed: ${error.locale} ${error.fileId}:${error.key}`,
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
      if (!isUserSource(id)) {
        return null;
      }
      const fileId = toFileId(projectRoot, id);
      const after = extractSchemas(code, fileId);

      if (after.length === 0) {
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
      const withSetup = `import '${SETUP_ID}';\n${result.code}`;
      return { code: withSetup };
    },
    async handleHotUpdate(ctx): Promise<void> {
      if (!isUserSource(ctx.file)) {
        return;
      }
      const fileId = toFileId(projectRoot, ctx.file);
      const code = await ctx.read();
      const before = schemasByFile.get(fileId) ?? [];
      const after = extractSchemas(code, fileId);
      if (schemasEqual(before, after)) {
        return;
      }
      if (after.length === 0) {
        schemasByFile.delete(fileId);
      } else {
        schemasByFile.set(fileId, after);
      }
      syncAll();
      fillStubs();
    },
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

function isUserSource(id: string): boolean {
  if (id.includes('node_modules')) {
    return false;
  }
  if (id.startsWith('\0')) {
    return false;
  }
  const path = id.split('?')[0] ?? id;
  return SOURCE_PATTERN.test(path);
}

function toFileId(projectRoot: string, id: string): string {
  const path = id.split('?')[0] ?? id;
  return relative(projectRoot, path).replaceAll('\\', '/');
}

function schemasEqual(
  a: ExtractedSchema[],
  b: ExtractedSchema[],
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
    if (left.fileId !== right.fileId) {
      return false;
    }
    if (left.variableName !== right.variableName) {
      return false;
    }
    if (JSON.stringify(left.schema) !== JSON.stringify(right.schema)) {
      return false;
    }
  }
  return true;
}
