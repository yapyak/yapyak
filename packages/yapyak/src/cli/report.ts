import type { Diagnostic, ExtractedMessage } from '../compiler';
import type { FilterPattern } from '../config';
import type { Processor } from '../processor';

import { extractFile, readLocaleFile, walkSourceFiles } from '../compiler';
import { createFilter } from '../config/internal';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

interface MissingEntry {
  fileId: string;
  locale: string;
  source: string;
}

interface LocaleStats {
  missing: number;
  translated: number;
}

interface Report {
  defaultLocale: string;
  diagnostics: Diagnostic[];
  locales: string[];
  messages: ExtractedMessage[];
  missing: MissingEntry[];
  perLocale: Record<string, LocaleStats>;
  totalMessages: number;
}

interface BuildReportInput {
  defaultLocale: string;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  processors?: Processor[];
  projectRoot: string;
}

export function buildReport(input: BuildReportInput): Report {
  const localesPath = join(input.projectRoot, input.localesDir);
  const fileLocales = existsSync(localesPath)
    ? readdirSync(localesPath)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
    : [];
  const { defaultLocale } = input;
  const locales = [...new Set([defaultLocale, ...fileLocales])].sort();

  const filter = createFilter(input.include, input.exclude);
  const sourceFiles = walkSourceFiles({
    filter,
    projectRoot: input.projectRoot,
  });

  const messages: ExtractedMessage[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const file of sourceFiles) {
    const result = extractFile({
      fileId: file.fileId,
      locales,
      processors: input.processors,
      source: file.code,
    });
    messages.push(...result.messages);
    diagnostics.push(...result.diagnostics);
  }

  const sourcesByFile: Record<string, Set<string>> = {};
  for (const message of messages) {
    const key =
      message.context === undefined
        ? message.source
        : `${message.source}@${message.context}`;
    for (const location of message.locations) {
      let sources = sourcesByFile[location.fileId];
      if (!sources) {
        sources = new Set();
        sourcesByFile[location.fileId] = sources;
      }
      sources.add(key);
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
      perLocale[locale] = {
        missing: 0,
        translated: totalMessages,
      };
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
    diagnostics,
    locales,
    messages,
    missing,
    perLocale,
    totalMessages,
  };
}
