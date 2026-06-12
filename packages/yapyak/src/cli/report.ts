import type { Diagnostic, ExtractedMessage } from '../compiler';
import type { FilterPattern } from '../config';
import type { Processor } from '../processor';

import {
  extractFile,
  findTranslation,
  fromMessageKey,
  readLocaleFile,
  toMessageKey,
  walkSourceFiles,
} from '../compiler';
import { createFilter } from '../config/internal';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

type MissingEntry = {
  context?: string;
  fileId: string;
  locale: string;
  source: string;
};

type LocaleStats = {
  missing: number;
  translated: number;
};

type Report = {
  defaultLocale: string;
  diagnostics: Diagnostic[];
  locales: string[];
  messages: ExtractedMessage[];
  missing: MissingEntry[];
  perLocale: Record<string, LocaleStats>;
  totalMessages: number;
};

type BuildReportInput = {
  defaultLocale: string;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  processors?: Processor[];
  projectRoot: string;
};

export function buildReport(input: BuildReportInput): Report {
  const localesPath = join(input.projectRoot, input.localesDir);
  const fileLocales = existsSync(localesPath)
    ? readdirSync(localesPath)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
    : [];
  const { defaultLocale } = input;
  const locales = [
    ...new Set([
      defaultLocale,
      ...fileLocales,
    ]),
  ].sort();

  const filter = createFilter(input.include, input.exclude);
  const sourceFiles = walkSourceFiles(filter, input.projectRoot);

  const messages: ExtractedMessage[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const file of sourceFiles) {
    const result = extractFile(file.fileId, file.code, {
      processors: input.processors,
    });
    messages.push(...result.messages);
    diagnostics.push(...result.diagnostics);
  }

  const keysByFile: Record<string, Set<string>> = {};
  for (const message of messages) {
    const key = toMessageKey(message.source, message.context);
    for (const location of message.locations) {
      let keys = keysByFile[location.fileId];
      if (!keys) {
        keys = new Set();
        keysByFile[location.fileId] = keys;
      }
      keys.add(key);
    }
  }

  const totalMessages = Object.values(keysByFile).reduce(
    (sum, file) => sum + file.size,
    0,
  );

  const perLocale: Record<string, LocaleStats> = {};
  const missing: MissingEntry[] = [];

  for (const locale of locales) {
    if (locale === defaultLocale) {
      perLocale[locale] = {
        missing: 0,
        translated: totalMessages,
      };
      continue;
    }
    const localeFile = readLocaleFile(join(localesPath, `${locale}.json`));
    let translated = 0;
    let missingCount = 0;
    for (const [fileId, keys] of Object.entries(keysByFile)) {
      const fileEntries = localeFile[fileId] ?? {};
      for (const key of keys) {
        const { context, source } = fromMessageKey(key);
        const value = findTranslation(fileEntries[source], context);
        if (typeof value === 'string' && value.trim() !== '') {
          translated++;
        } else {
          missingCount++;
          const entry: MissingEntry = {
            fileId,
            locale,
            source,
          };
          if (context !== undefined) {
            entry.context = context;
          }
          missing.push(entry);
        }
      }
    }
    perLocale[locale] = {
      missing: missingCount,
      translated,
    };
  }

  return {
    defaultLocale,
    diagnostics,
    locales,
    messages,
    missing,
    perLocale,
    totalMessages,
  };
}
