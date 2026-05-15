import type { ExtractedMessage } from '../vite/index.ts';

import { createFilter } from 'vite';

import {
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  DynamicMessageError,
  extractMessages,
  readLocaleFile,
  walkSourceFiles,
} from '../vite/index.ts';
import { existsSync, readdirSync } from 'node:fs';
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
    const data = readLocaleFile(join(localesPath, `${locale}.json`));
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
