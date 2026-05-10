import { relative } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { autoTranslate } from './auto-translate.js';
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

export function yapyak(options: YapyakOptions): Plugin {
  const normalized = normalizeOptions(options);
  const schemasByFile = new Map<string, ExtractedSchema[]>();
  let projectRoot = process.cwd();
  let localeCache: LocaleData | null = null;

  function getLocaleData(): LocaleData {
    if (localeCache === null) {
      localeCache = readLocaleData({
        locales: normalized.locales,
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
    syncLocaleFiles({
      defaultLocale: normalized.defaultLocale,
      locales: normalized.locales,
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
    void autoTranslate({
      defaultLocale: normalized.defaultLocale,
      locales: normalized.locales,
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
    configResolved(config: ResolvedConfig): void {
      projectRoot = config.root;
    },
    buildStart(): void {
      scanAllSources();
      fillStubs();
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

      const result = transformSource(code, {
        defaultLocale: normalized.defaultLocale,
        fileId,
        helperImport: helperImportFor(normalized.framework),
        localeData: getLocaleData(),
        locales: normalized.locales,
      });
      if (result === null) {
        return null;
      }
      return { code: result.code };
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

function helperImportFor(framework: 'react' | 'vue' | 'svelte' | null): string {
  if (framework === 'react') {
    return 'yapyak/react/with-locale';
  }
  if (framework === 'vue') {
    return 'yapyak/vue/with-locale';
  }
  if (framework === 'svelte') {
    return 'yapyak/svelte/with-locale';
  }
  return 'yapyak/with-locale';
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
