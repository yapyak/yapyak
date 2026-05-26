import type { LocaleFile } from '@yapyak/compiler';
import type { ExtractedMessage } from '@yapyak/compiler/internal';
import type { Config } from '../config';

import { readLocaleFile, stringifyCanonical } from '@yapyak/compiler';

import { buildReport } from '../report';
import { color, symbol } from '../tui';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

export interface ExportOptions {
  config: Config;
  locales: string[];
  out: string | undefined;
  projectRoot: string;
  split: boolean;
}

type Snapshot = Record<string, LocaleFile>;

export function exportCommand(options: ExportOptions): number {
  const { config, locales: localeFilter, out, projectRoot, split } = options;

  if (split && !out) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('--split requires --out=<dir>')}\n\n`,
    );
    return 1;
  }

  if (out && isInsideLocalesDir(out, projectRoot, config.localesDir)) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red(`yapyak export refuses to write inside ${config.localesDir}/.`)}\n  ${color.dim('That directory is owned by the plugin and represents the on-disk state, not a derived snapshot.')}\n\n`,
    );
    return 1;
  }

  const report = buildReport({
    defaultLocale: config.defaultLocale,
    localesDir: config.localesDir,
    projectRoot,
  });
  const allLocales = report.locales;
  const targetLocales =
    localeFilter.length === 0
      ? allLocales
      : localeFilter.filter((locale) => allLocales.includes(locale));

  const unknown = localeFilter.filter((locale) => !allLocales.includes(locale));
  if (unknown.length > 0) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red(`Unknown locale${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`)}\n  ${color.dim(`Known: ${allLocales.join(', ')}`)}\n\n`,
    );
    return 1;
  }

  const sourcesByFile = buildSourcesByFile(report.messages);
  const snapshot = buildSnapshot({
    defaultLocale: report.defaultLocale,
    localesDir: join(projectRoot, config.localesDir),
    sourcesByFile,
    targetLocales,
  });

  if (split) {
    const outDir = resolve(projectRoot, out as string);
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    for (const [locale, data] of Object.entries(snapshot)) {
      const wrapped = { [locale]: data };
      writeFileSync(
        join(outDir, `${locale}.json`),
        stringifyCanonical(wrapped),
      );
    }
    process.stdout.write(
      `  ${symbol.check} Exported ${color.bold(String(Object.keys(snapshot).length))} locale${Object.keys(snapshot).length === 1 ? '' : 's'} to ${color.bold(out as string)}/\n`,
    );
    return 0;
  }

  const payload = stringifyCanonical(snapshot);
  if (!out) {
    process.stdout.write(`${payload}\n`);
    return 0;
  }
  const outPath = resolve(projectRoot, out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, payload);
  process.stdout.write(
    `  ${symbol.check} Wrote ${color.bold(out)} (${Object.keys(snapshot).length} locale${Object.keys(snapshot).length === 1 ? '' : 's'})\n`,
  );
  return 0;
}

function buildSourcesByFile(
  messages: ExtractedMessage[],
): Map<string, Set<string>> {
  const sourcesByFile = new Map<string, Set<string>>();
  for (const message of messages) {
    for (const location of message.locations) {
      let sources = sourcesByFile.get(location.fileId);
      if (!sources) {
        sources = new Set();
        sourcesByFile.set(location.fileId, sources);
      }
      sources.add(message.source);
    }
  }
  return sourcesByFile;
}

function buildSnapshot(args: {
  defaultLocale: string;
  localesDir: string;
  sourcesByFile: Map<string, Set<string>>;
  targetLocales: string[];
}): Snapshot {
  const snapshot: Snapshot = {};
  for (const locale of args.targetLocales) {
    snapshot[locale] = buildLocaleFile({
      defaultLocale: args.defaultLocale,
      locale,
      localePath: join(args.localesDir, `${locale}.json`),
      sourcesByFile: args.sourcesByFile,
    });
  }
  return snapshot;
}

function buildLocaleFile(args: {
  defaultLocale: string;
  locale: string;
  localePath: string;
  sourcesByFile: Map<string, Set<string>>;
}): LocaleFile {
  const isDefault = args.locale === args.defaultLocale;
  const onDisk = isDefault ? {} : readLocaleFile(args.localePath);
  const localeFile: LocaleFile = {};
  for (const [fileId, sources] of args.sourcesByFile) {
    const entries: Record<string, string> = {};
    const fileEntries = onDisk[fileId] ?? {};
    for (const source of sources) {
      if (isDefault) {
        entries[source] = source;
      } else {
        entries[source] = fileEntries[source] ?? '';
      }
    }
    localeFile[fileId] = entries;
  }
  return localeFile;
}

function isInsideLocalesDir(
  out: string,
  projectRoot: string,
  localesDir: string,
): boolean {
  const absOut = isAbsolute(out) ? out : resolve(projectRoot, out);
  const absLocales = resolve(projectRoot, localesDir);
  return absOut === absLocales || absOut.startsWith(`${absLocales}/`);
}
