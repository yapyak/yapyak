import type { ExtractedMessage, LocaleFile } from '../../compiler';
import type { Processor } from '../../processor';
import type { Config } from '../config';

import {
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  extractFile,
  readLocaleFile,
  stringifyCanonical,
  walkSourceFiles,
} from '../../compiler';
import { createFilter } from '../../config/internal';
import { color, header, symbol } from '../tui';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface CleanOptions {
  config: Config;
  projectRoot: string;
  write: boolean;
}

interface OrphanSource {
  fileId: string;
  locale: string;
  source: string;
}

export function clean(options: CleanOptions): number {
  const localesPath = join(options.projectRoot, options.config.localesDir);
  const fileLocales = existsSync(localesPath)
    ? readdirSync(localesPath)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
    : [];
  const defaultLocale = options.config.defaultLocale ?? 'en';
  const locales = fileLocales.filter((locale) => locale !== defaultLocale);

  process.stdout.write(header('Locale cleanup'));

  const expected = buildExpected(
    options.projectRoot,
    locales,
    options.config.processors,
  );
  const orphanSources: OrphanSource[] = [];
  const filesToWrite: Array<{ next: LocaleFile; path: string }> = [];

  for (const locale of locales) {
    const localePath = join(localesPath, `${locale}.json`);
    const existing = readLocaleFile(localePath);
    const next: LocaleFile = {};
    let changed = false;

    for (const [fileId, entries] of Object.entries(existing)) {
      const expectedSources = expected[fileId];
      const nextEntries: Record<string, string> = {};
      for (const [source, value] of Object.entries(entries)) {
        if (!expectedSources || !expectedSources.has(source)) {
          orphanSources.push({ fileId, locale, source });
          changed = true;
          continue;
        }
        nextEntries[source] = value;
      }
      if (Object.keys(nextEntries).length > 0) {
        next[fileId] = nextEntries;
      }
    }

    if (changed && options.write) {
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

  if (!options.write) {
    process.stdout.write(
      `  ${color.dim('Run')} ${color.cyan('yapyak clean --write')} ${color.dim('to remove these entries.')}\n\n`,
    );
    return 0;
  }

  for (const file of filesToWrite) {
    writeFileSync(file.path, stringifyCanonical(file.next));
  }
  process.stdout.write(
    `  ${symbol.check} ${color.green(`Removed ${orphanSources.length} entry/entries from ${filesToWrite.length} locale file(s).`)}\n\n`,
  );
  return 0;
}

function buildExpected(
  projectRoot: string,
  locales: string[],
  processors: readonly Processor[],
): Record<string, Set<string>> {
  const filter = createFilter(DEFAULT_INCLUDE, DEFAULT_EXCLUDE);
  const sourceFiles = walkSourceFiles({ filter, projectRoot });
  const messages: ExtractedMessage[] = [];
  for (const file of sourceFiles) {
    const result = extractFile({
      fileId: file.fileId,
      locales,
      processors,
      source: file.code,
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
  return expected;
}
