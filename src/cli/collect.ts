import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';
import { extractSchemas } from '../vite/extract-schemas.js';
import { walkSourceFiles } from '../vite/walk-source-files.js';

export interface MissingEntry {
  fileId: string;
  key: string;
  locale: string;
}

export interface LocaleStats {
  missing: number;
  translated: number;
}

export interface CollectResult {
  defaultLocale: string;
  locales: string[];
  missing: MissingEntry[];
  perLocale: Record<string, LocaleStats>;
  totalMessages: number;
}

export interface CollectOptions {
  defaultLocale?: string;
  localesDir?: string;
  projectRoot: string;
}

const SOURCE_PATTERN = /\.(?:tsx?|jsx?|mjs|cjs|mts|cts)$/;

export function collect(options: CollectOptions): CollectResult {
  const localesDir = options.localesDir ?? 'locales';
  const localesPath = join(options.projectRoot, localesDir);
  const locales = existsSync(localesPath)
    ? readdirSync(localesPath)
        .filter((name) => name.endsWith('.yml'))
        .map((name) => name.replace(/\.yml$/, ''))
        .sort()
    : [];
  if (locales.length === 0) {
    throw new Error(
      `No locale files found in ${localesPath}. Run yapyak init first.`,
    );
  }
  const defaultLocale = options.defaultLocale ?? inferDefaultLocale(locales);

  const sourceFiles = walkSourceFiles({
    pattern: SOURCE_PATTERN,
    projectRoot: options.projectRoot,
    roots: ['src'],
  });

  const sourcesByFile: Record<string, Record<string, string>> = {};
  for (const file of sourceFiles) {
    const schemas = extractSchemas(file.code, file.fileId);
    if (schemas.length === 0) {
      continue;
    }
    const flat = sourcesByFile[file.fileId] ?? {};
    for (const schema of schemas) {
      for (const [key, value] of Object.entries(schema.schema)) {
        if (typeof value === 'string') {
          flat[key] = value;
        }
      }
    }
    sourcesByFile[file.fileId] = flat;
  }

  const totalMessages = Object.values(sourcesByFile).reduce(
    (sum, file) => sum + Object.keys(file).length,
    0,
  );

  const perLocale: Record<string, LocaleStats> = {};
  const missing: MissingEntry[] = [];

  for (const locale of locales) {
    const data = readLocale(join(localesPath, `${locale}.yml`));
    let translated = 0;
    let missingCount = 0;
    for (const [fileId, sources] of Object.entries(sourcesByFile)) {
      const fileEntries = data[fileId] ?? {};
      for (const key of Object.keys(sources)) {
        const value = fileEntries[key];
        if (typeof value === 'string' && value.trim() !== '') {
          translated++;
        } else {
          missingCount++;
          missing.push({ fileId, key, locale });
        }
      }
    }
    perLocale[locale] = { missing: missingCount, translated };
  }

  return { defaultLocale, locales, missing, perLocale, totalMessages };
}

function inferDefaultLocale(locales: string[]): string {
  return locales.includes('en') ? 'en' : (locales[0] ?? 'en');
}

function readLocale(path: string): Record<string, Record<string, string>> {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (content.trim() === '') {
    return {};
  }
  const parsed: unknown = parse(content);
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  const result: Record<string, Record<string, string>> = {};
  for (const [fileId, entries] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (typeof entries !== 'object' || entries === null) {
      continue;
    }
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      entries as Record<string, unknown>,
    )) {
      if (typeof value === 'string') {
        flat[key] = value;
      }
    }
    result[fileId] = flat;
  }
  return result;
}

export function relativeFileId(projectRoot: string, fullPath: string): string {
  return relative(projectRoot, fullPath).split(sep).join('/');
}
