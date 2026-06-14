import type {
  CatalogEntry,
  ExtractedMessage,
  LocaleFile,
} from '../../compiler';
import type { Config } from '../config';

import {
  findTranslation,
  readLocaleFile,
  stringifyCanonical,
  toEntry,
  toMessageKey,
} from '../../compiler';
import { buildReport } from '../report';
import { color, symbol } from '../tui';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

export type ExportOptions = {
  locales: string[];
  out?: string;
  split: boolean;
};

type Snapshot = Record<string, LocaleFile>;

export function exportCommand(
  config: Config,
  projectRoot: string,
  options: ExportOptions,
): number {
  const { locales: localeFilter, out, split } = options;

  if (split && !out) {
    process.stderr.write(
      `\n  ${symbol.cross} ${color.red('--split requires --out=<dir>')}\n\n`,
    );
    return 1;
  }

  if (out && isInsideLocalesDir(out, projectRoot, config.localesDir)) {
    process.stderr.write(
      `\n  ${symbol.cross} ${color.red(`yapyak export refuses to write inside ${config.localesDir}/.`)}\n  ${color.dim('That directory is owned by the plugin and represents the on-disk state, not a derived snapshot.')}\n\n`,
    );
    return 1;
  }

  const report = buildReport({
    defaultLocale: config.defaultLocale,
    exclude: config.exclude,
    include: config.include,
    localesDir: config.localesDir,
    processors: config.processors,
    projectRoot,
  });
  const allLocales = report.locales;
  const targetLocales =
    localeFilter.length === 0
      ? allLocales
      : localeFilter.filter((locale) => allLocales.includes(locale));

  const unknown = localeFilter.filter((locale) => !allLocales.includes(locale));
  if (unknown.length > 0) {
    process.stderr.write(
      `\n  ${symbol.cross} ${color.red(`Unknown locale${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`)}\n  ${color.dim(`Known: ${allLocales.join(', ')}`)}\n\n`,
    );
    return 1;
  }

  const variantsByFile = buildVariantsByFile(report.messages);
  const snapshot = buildSnapshot({
    defaultLocale: report.defaultLocale,
    localesDir: join(projectRoot, config.localesDir),
    targetLocales,
    variantsByFile,
  });

  if (split) {
    const outputDirectory = resolve(projectRoot, out as string);
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, {
        recursive: true,
      });
    }
    for (const [locale, data] of Object.entries(snapshot)) {
      const wrapped = {
        [locale]: data,
      };
      writeFileSync(
        join(outputDirectory, `${locale}.json`),
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
  mkdirSync(dirname(outPath), {
    recursive: true,
  });
  writeFileSync(outPath, payload);
  process.stdout.write(
    `  ${symbol.check} Wrote ${color.bold(out)} (${Object.keys(snapshot).length} locale${Object.keys(snapshot).length === 1 ? '' : 's'})\n`,
  );
  return 0;
}

type ExportVariant = {
  context?: string;
  source: string;
};

function buildVariantsByFile(
  messages: ExtractedMessage[],
): Map<string, ExportVariant[]> {
  const byFile = new Map<string, Map<string, ExportVariant>>();
  for (const message of messages) {
    const key = toMessageKey(message.source, message.context);
    const variant: ExportVariant =
      message.context === undefined
        ? {
            source: message.source,
          }
        : {
            context: message.context,
            source: message.source,
          };
    for (const location of message.locations) {
      let variants = byFile.get(location.fileId);
      if (!variants) {
        variants = new Map();
        byFile.set(location.fileId, variants);
      }
      variants.set(key, variant);
    }
  }
  const result = new Map<string, ExportVariant[]>();
  for (const [fileId, variants] of byFile) {
    result.set(fileId, [
      ...variants.values(),
    ]);
  }
  return result;
}

function buildSnapshot(args: {
  defaultLocale: string;
  localesDir: string;
  targetLocales: string[];
  variantsByFile: Map<string, ExportVariant[]>;
}): Snapshot {
  const snapshot: Snapshot = {};
  for (const locale of args.targetLocales) {
    snapshot[locale] = buildLocaleFile({
      defaultLocale: args.defaultLocale,
      locale,
      localePath: join(args.localesDir, `${locale}.json`),
      variantsByFile: args.variantsByFile,
    });
  }
  return snapshot;
}

function buildLocaleFile(args: {
  defaultLocale: string;
  locale: string;
  localePath: string;
  variantsByFile: Map<string, ExportVariant[]>;
}): LocaleFile {
  const isDefault = args.locale === args.defaultLocale;
  let onDisk: LocaleFile;
  if (isDefault) {
    onDisk = {};
  } else {
    try {
      onDisk = readLocaleFile(args.localePath);
    } catch {
      onDisk = {};
    }
  }
  const localeFile: LocaleFile = {};
  for (const [fileId, variants] of args.variantsByFile) {
    const fileEntries = onDisk[fileId];
    const byContextBySource = new Map<
      string,
      Map<string | undefined, string>
    >();
    for (const { context, source } of variants) {
      const value = isDefault
        ? source
        : (findTranslation(fileEntries?.[source], context) ?? '');
      let byContext = byContextBySource.get(source);
      if (!byContext) {
        byContext = new Map();
        byContextBySource.set(source, byContext);
      }
      byContext.set(context, value);
    }
    const entries: Record<string, CatalogEntry> = Object.create(null);
    for (const [source, byContext] of byContextBySource) {
      entries[source] = toEntry(byContext, source);
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
  if (absOut === absLocales) {
    return true;
  }
  const rel = relative(absLocales, absOut);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}
