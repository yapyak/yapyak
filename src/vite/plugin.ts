import { relative } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
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

  return {
    name: 'yapyak',
    configResolved(config: ResolvedConfig): void {
      projectRoot = config.root;
    },
    transform(code: string, id: string): { code: string } | null {
      if (!isUserSource(id)) {
        return null;
      }
      const fileId = toFileId(projectRoot, id);
      const before = schemasByFile.get(fileId) ?? [];
      const after = extractSchemas(code, fileId);

      if (!schemasEqual(before, after)) {
        if (after.length === 0) {
          schemasByFile.delete(fileId);
        } else {
          schemasByFile.set(fileId, after);
        }
        syncAll();
      }

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
  if (id.includes('?')) {
    return false;
  }
  return SOURCE_PATTERN.test(id);
}

function toFileId(projectRoot: string, id: string): string {
  return relative(projectRoot, id).replaceAll('\\', '/');
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
