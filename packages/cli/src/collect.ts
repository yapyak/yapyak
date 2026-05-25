import type { ExtractedMessage } from '@yapyak/compiler/internal';

import { readLocaleFile } from '@yapyak/compiler';
import {
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  extractFile,
  walkSourceFiles,
} from '@yapyak/compiler/internal';
import { createFilter } from '@yapyak/config/internal';

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
    const result = extractFile({
      fileId: file.fileId,
      locales,
      source: file.code,
    });
    messages.push(...result.messages);
  }

  const sourcesByFile: Record<string, Set<string>> = {};
  for (const message of messages) {
    for (const location of message.locations) {
      let sources = sourcesByFile[location.fileId];
      if (sources === undefined) {
        sources = new Set();
        sourcesByFile[location.fileId] = sources;
      }
      sources.add(message.source);
    }
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
    const localeFile = readLocaleFile(join(localesPath, `${locale}.json`));
    let translated = 0;
    let missingCount = 0;
    for (const [fileId, sources] of Object.entries(sourcesByFile)) {
      const fileEntries = localeFile[fileId] ?? {};
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
