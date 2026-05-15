import type { ExtractedMessage } from '../vite/index.ts';

import { createFilter } from 'vite';

import {
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  DynamicMessageError,
  extractMessages,
  walkSourceFiles,
} from '../vite/index.ts';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MissingEntry {
  fileId: string;
  locale: string;
  source: string;
}

export interface LocaleStats {
  missing: number;
  translated: number;
}

export interface CollectResult {
  defaultLocale: string;
  locales: string[];
  messages: ExtractedMessage[];
  missing: MissingEntry[];
  perLocale: Record<string, LocaleStats>;
  totalMessages: number;
}

export interface CollectOptions {
  defaultLocale?: string;
  localesDir?: string;
  projectRoot: string;
}

export function collect(options: CollectOptions): CollectResult {
  const localesDir = options.localesDir ?? 'locales';
  const localesPath = join(options.projectRoot, localesDir);
  const fileLocales = existsSync(localesPath)
    ? readdirSync(localesPath)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
    : [];
  const defaultLocale = options.defaultLocale ?? 'en';
  const locales = [...new Set([defaultLocale, ...fileLocales])].sort();

  const filter = createFilter(DEFAULT_INCLUDE, DEFAULT_EXCLUDE);
  const sourceFiles = walkSourceFiles({
    filter,
    projectRoot: options.projectRoot,
  });

  const messages: ExtractedMessage[] = [];
  for (const file of sourceFiles) {
    let extracted: ExtractedMessage[];
    try {
      extracted = extractMessages({ code: file.code, fileId: file.fileId });
    } catch (error) {
      if (error instanceof DynamicMessageError) {
        continue;
      }
      throw error;
    }
    messages.push(...extracted);
  }

  const sourcesByFile: Record<string, Set<string>> = {};
  for (const message of messages) {
    let set = sourcesByFile[message.fileId];
    if (set === undefined) {
      set = new Set();
      sourcesByFile[message.fileId] = set;
    }
    set.add(message.source);
  }

  const totalMessages = Object.values(sourcesByFile).reduce(
    (sum, file) => sum + file.size,
    0,
  );

  const perLocale: Record<string, LocaleStats> = {};
  const missing: MissingEntry[] = [];

  for (const locale of locales) {
    if (locale === defaultLocale) {
      perLocale[locale] = { missing: 0, translated: totalMessages };
      continue;
    }
    const data = readLocale(join(localesPath, `${locale}.json`));
    let translated = 0;
    let missingCount = 0;
    for (const [fileId, sources] of Object.entries(sourcesByFile)) {
      const fileEntries = data[fileId] ?? {};
      for (const source of sources) {
        const value = fileEntries[source];
        if (typeof value === 'string' && value.trim() !== '') {
          translated++;
        } else {
          missingCount++;
          missing.push({ fileId, locale, source });
        }
      }
    }
    perLocale[locale] = { missing: missingCount, translated };
  }

  return {
    defaultLocale,
    locales,
    messages,
    missing,
    perLocale,
    totalMessages,
  };
}

function readLocale(path: string): Record<string, Record<string, string>> {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (content.trim() === '') {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {};
  }
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
    for (const [source, value] of Object.entries(
      entries as Record<string, unknown>,
    )) {
      if (typeof value === 'string') {
        flat[source] = value;
      }
    }
    result[fileId] = flat;
  }
  return result;
}
