import type {
  ExtractedMessage,
  LocaleFile,
  LocaleFileEntry,
} from '@yapyak/compiler';
import type { Config } from '../config';

import {
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  extractFile,
  readLocaleFile,
  stringifyCanonical,
  walkSourceFiles,
} from '@yapyak/compiler';
import { createFilter } from '@yapyak/config';

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

interface OrphanTag {
  fileId: string;
  locale: string;
  source: string;
  tag: string;
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

  const expected = buildExpected(options.projectRoot, locales);
  const orphanSources: OrphanSource[] = [];
  const orphanTags: OrphanTag[] = [];
  const filesToWrite: Array<{ next: LocaleFile; path: string }> = [];

  for (const locale of locales) {
    const localePath = join(localesPath, `${locale}.json`);
    const existing = readLocaleFile(localePath);
    const next: LocaleFile = {};
    let changed = false;

    for (const [fileId, entries] of Object.entries(existing)) {
      const expectedForFile = expected[fileId];
      const nextEntries: Record<string, LocaleFileEntry> = {};
      for (const [source, value] of Object.entries(entries)) {
        const expectedTags = expectedForFile?.[source];
        if (expectedTags === undefined) {
          orphanSources.push({ fileId, locale, source });
          changed = true;
          continue;
        }
        if (expectedTags === null) {
          nextEntries[source] = value;
          continue;
        }
        if (typeof value !== 'object') {
          nextEntries[source] = value;
          continue;
        }
        const nextTags: Record<string, string> = {};
        for (const [tag, translation] of Object.entries(value)) {
          if (expectedTags.has(tag)) {
            nextTags[tag] = translation;
          } else {
            orphanTags.push({ fileId, locale, source, tag });
            changed = true;
          }
        }
        if (Object.keys(nextTags).length > 0) {
          nextEntries[source] = nextTags;
        }
      }
      if (Object.keys(nextEntries).length > 0) {
        next[fileId] = nextEntries;
      }
    }

    if (changed && options.write) {
      filesToWrite.push({ next, path: localePath });
    }
  }

  if (orphanSources.length === 0 && orphanTags.length === 0) {
    process.stdout.write(
      `  ${symbol.check} ${color.green('No orphan entries.')}\n\n`,
    );
    return 0;
  }

  if (orphanSources.length > 0) {
    process.stdout.write(
      `  ${symbol.cross} ${color.red(`${orphanSources.length} orphan source(s)`)}\n\n`,
    );
    for (const orphan of orphanSources) {
      process.stdout.write(
        `    ${color.dim(orphan.locale)} ${color.dim('—')} ${color.dim(orphan.fileId)} ${color.dim('—')} ${color.bold(orphan.source)}\n`,
      );
    }
    process.stdout.write('\n');
  }

  if (orphanTags.length > 0) {
    process.stdout.write(
      `  ${symbol.cross} ${color.red(`${orphanTags.length} orphan tag(s)`)}\n\n`,
    );
    for (const orphan of orphanTags) {
      process.stdout.write(
        `    ${color.dim(orphan.locale)} ${color.dim('—')} ${color.dim(orphan.fileId)} ${color.dim('—')} ${color.bold(orphan.source)}.${color.cyan(orphan.tag)}\n`,
      );
    }
    process.stdout.write('\n');
  }

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
    `  ${symbol.check} ${color.green(`Removed ${orphanSources.length + orphanTags.length} entry/entries from ${filesToWrite.length} locale file(s).`)}\n\n`,
  );
  return 0;
}

function buildExpected(
  projectRoot: string,
  locales: string[],
): Record<string, Record<string, Set<string> | null>> {
  const filter = createFilter(DEFAULT_INCLUDE, DEFAULT_EXCLUDE);
  const sourceFiles = walkSourceFiles({ filter, projectRoot });
  const messages: ExtractedMessage[] = [];
  for (const file of sourceFiles) {
    const result = extractFile({
      fileId: file.fileId,
      locales,
      source: file.code,
    });
    messages.push(...result.messages);
  }
  const expected: Record<string, Record<string, Set<string> | null>> = {};
  for (const message of messages) {
    for (const location of message.locations) {
      let perFile = expected[location.fileId];
      if (!perFile) {
        perFile = {};
        expected[location.fileId] = perFile;
      }
      const current = perFile[message.source];
      if (location.tag === undefined) {
        if (current === undefined) {
          perFile[message.source] = null;
        }
        continue;
      }
      if (current === undefined || current === null) {
        perFile[message.source] = new Set([location.tag]);
        continue;
      }
      current.add(location.tag);
    }
  }
  return expected;
}
