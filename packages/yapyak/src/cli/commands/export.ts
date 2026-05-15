import type { LocaleFile } from '../../vite/index.ts';
import type { YapyakCliConfig } from '../load-config.ts';

import { readLocaleFile } from '../../vite/index.ts';
import { collect } from '../collect.ts';
import { color, symbol } from '../tui.ts';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

export interface ExportOptions {
  config: YapyakCliConfig;
  locales: string[];
  out: string | undefined;
  projectRoot: string;
  split: boolean;
}

type Snapshot = Record<string, LocaleFile>;

export function exportCommand(options: ExportOptions): number {
  const { config, locales: localeFilter, out, projectRoot, split } = options;

  if (split && out === undefined) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('--split requires --out=<dir>')}\n\n`,
    );
    return 1;
  }

  if (
    out !== undefined &&
    isInsideLocalesDir(out, projectRoot, config.localesDir)
  ) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red(`yapyak export refuses to write inside ${config.localesDir}/.`)}\n  ${color.dim('That directory is owned by the plugin and represents the on-disk state, not a derived snapshot.')}\n\n`,
    );
    return 1;
  }

  const collected = collect({
    defaultLocale: config.defaultLocale,
    localesDir: config.localesDir,
    projectRoot,
  });
  const allLocales = collected.locales;
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

  const sourcesByFile = buildSourcesByFile(collected.messages);
  const snapshot = buildSnapshot({
    defaultLocale: collected.defaultLocale,
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
      writeFileSync(join(outDir, `${locale}.json`), stringify(wrapped));
    }
    process.stdout.write(
      `  ${symbol.check} Exported ${color.bold(String(Object.keys(snapshot).length))} locale${Object.keys(snapshot).length === 1 ? '' : 's'} to ${color.bold(out as string)}/\n`,
    );
    return 0;
  }

  const payload = stringify(snapshot);
  if (out === undefined) {
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
  messages: { fileId: string; source: string }[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const message of messages) {
    let sources = map.get(message.fileId);
    if (sources === undefined) {
      sources = new Set();
      map.set(message.fileId, sources);
    }
    sources.add(message.source);
  }
  return map;
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
      isDefault: locale === args.defaultLocale,
      localePath: join(args.localesDir, `${locale}.json`),
      sourcesByFile: args.sourcesByFile,
    });
  }
  return snapshot;
}

function buildLocaleFile(args: {
  isDefault: boolean;
  localePath: string;
  sourcesByFile: Map<string, Set<string>>;
}): LocaleFile {
  const onDisk = args.isDefault ? {} : readLocaleFile(args.localePath);
  const result: LocaleFile = {};
  for (const [fileId, sources] of args.sourcesByFile) {
    const entries: Record<string, string> = {};
    const fileEntries = onDisk[fileId] ?? {};
    for (const source of sources) {
      if (args.isDefault) {
        entries[source] = source;
      } else {
        entries[source] = fileEntries[source] ?? '';
      }
    }
    result[fileId] = entries;
  }
  return result;
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

function stringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
