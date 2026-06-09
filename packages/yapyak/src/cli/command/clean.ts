import type { ExtractedMessage, LocaleFile } from '../../compiler';
import type { Config } from '../config';

import {
  extractFile,
  readLocaleFile,
  walkSourceFiles,
  writeLocaleFile,
} from '../../compiler';
import { createFilter } from '../../config/internal';
import { color, header, symbol } from '../tui';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

interface OrphanSource {
  fileId: string;
  locale: string;
  source: string;
}

interface BuildExpectedResult {
  expected: Record<string, Set<string>>;
  inScope: (fileId: string) => boolean;
}

export function clean(
  config: Config,
  projectRoot: string,
  write: boolean,
): number {
  const localesPath = join(projectRoot, config.localesDir);
  const fileLocales = existsSync(localesPath)
    ? readdirSync(localesPath)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
    : [];
  const { defaultLocale } = config;
  const locales = fileLocales.filter((locale) => locale !== defaultLocale);

  process.stdout.write(header('Locale cleanup'));

  const { expected, inScope } = buildExpected(projectRoot, locales, config);
  const orphanSources: OrphanSource[] = [];
  const filesToWrite: Array<{ next: LocaleFile; path: string }> = [];

  for (const locale of locales) {
    const localePath = join(localesPath, `${locale}.json`);
    const existing = readLocaleFile(localePath);
    const next: LocaleFile = {};
    let hasChanged = false;

    for (const [fileId, entries] of Object.entries(existing)) {
      if (!inScope(fileId)) {
        next[fileId] = { ...entries };
        continue;
      }
      const expectedSources = expected[fileId];
      const nextEntries: Record<string, string> = {};
      for (const [source, value] of Object.entries(entries)) {
        if (!expectedSources?.has(source)) {
          orphanSources.push({ fileId, locale, source });
          hasChanged = true;
          continue;
        }
        nextEntries[source] = value;
      }
      if (Object.keys(nextEntries).length > 0) {
        next[fileId] = nextEntries;
      }
    }

    if (hasChanged && write) {
      filesToWrite.push({ next, path: localePath });
    }
  }

  if (orphanSources.length === 0) {
    process.stdout.write(
      `  ${symbol.check} ${color.green('No orphan entries.')}\n\n`,
    );
    return 0;
  }

  process.stdout.write(
    `  ${symbol.cross} ${color.red(`${orphanSources.length} orphan source(s)`)}\n\n`,
  );
  for (const orphan of orphanSources) {
    process.stdout.write(
      `    ${color.dim(orphan.locale)} ${color.dim('—')} ${color.dim(orphan.fileId)} ${color.dim('—')} ${color.bold(orphan.source)}\n`,
    );
  }
  process.stdout.write('\n');

  if (!write) {
    process.stdout.write(
      `  ${color.dim('Run')} ${color.cyan('yapyak clean --write')} ${color.dim('to remove these entries.')}\n\n`,
    );
    return 0;
  }

  for (const file of filesToWrite) {
    writeLocaleFile({
      after: file.next,
      extractedSources: expected,
      filePath: file.path,
    });
  }
  process.stdout.write(
    `  ${symbol.check} ${color.green(`Removed ${orphanSources.length} entry/entries from ${filesToWrite.length} locale file(s).`)}\n\n`,
  );
  return 0;
}

function buildExpected(
  projectRoot: string,
  locales: string[],
  config: Config,
): BuildExpectedResult {
  const filter = createFilter(config.include, config.exclude);
  const sourceFiles = walkSourceFiles(filter, projectRoot);
  const scopedFileIds = new Set<string>(sourceFiles.map((file) => file.fileId));
  const messages: ExtractedMessage[] = [];
  for (const file of sourceFiles) {
    const result = extractFile(file.fileId, locales, file.code, {
      processors: config.processors,
    });
    messages.push(...result.messages);
  }
  const expected: Record<string, Set<string>> = {};
  for (const message of messages) {
    const key =
      message.context === undefined
        ? message.source
        : `${message.source}@${message.context}`;
    for (const location of message.locations) {
      let perFile = expected[location.fileId];
      if (!perFile) {
        perFile = new Set<string>();
        expected[location.fileId] = perFile;
      }
      perFile.add(key);
    }
  }
  return {
    expected,
    inScope: (fileId): boolean => scopedFileIds.has(fileId),
  };
}
