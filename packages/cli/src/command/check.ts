import type { Diagnostic } from '@yapyak/compiler';
import type { Config } from '../config';

import {
  readLocaleFile,
  validateIcuPairs,
  validateLocaleFile,
} from '@yapyak/compiler';

import { buildReport } from '../report';
import { color, header, symbol } from '../tui';
import { join } from 'node:path';

interface CheckOptions {
  config: Config;
  projectRoot: string;
}

interface MissingTranslation {
  fileId: string;
  locale: string;
  source: string;
}

export function check(options: CheckOptions): number {
  const report = buildReport({
    defaultLocale: options.config.defaultLocale,
    localesDir: options.config.localesDir,
    projectRoot: options.projectRoot,
  });

  const localesPath = join(options.projectRoot, options.config.localesDir);
  const allDiagnostics: Diagnostic[] = [...report.diagnostics];

  for (const locale of report.locales) {
    if (locale === report.defaultLocale) {
      continue;
    }
    const localeFilePath = join(localesPath, `${locale}.json`);
    const fileId = `${locale}.json`;
    allDiagnostics.push(
      ...validateLocaleFile({ fileId, path: localeFilePath }),
    );
    const localeFile = readLocaleFile(localeFilePath);
    allDiagnostics.push(
      ...validateIcuPairs({ fileId, localeFile, messages: report.messages }),
    );
  }

  const errors = allDiagnostics.filter((d) => d.severity === 'error');
  const warnings = allDiagnostics.filter((d) => d.severity === 'warning');

  process.stdout.write(header('Translation check'));

  if (
    report.missing.length === 0 &&
    errors.length === 0 &&
    warnings.length === 0
  ) {
    const total = report.totalMessages * report.locales.length;
    process.stdout.write(
      `  ${symbol.check} ${color.green(`All ${total} translations present, no diagnostics.`)}\n\n`,
    );
    return 0;
  }

  if (report.missing.length > 0) {
    const byLocale: Record<string, MissingTranslation[]> = {};
    for (const entry of report.missing) {
      const list = byLocale[entry.locale];
      if (!list) {
        byLocale[entry.locale] = [entry];
      } else {
        list.push(entry);
      }
    }

    process.stdout.write(
      `  ${symbol.cross} ${color.red(`${report.missing.length} missing translations`)}\n\n`,
    );

    for (const [locale, entries] of Object.entries(byLocale)) {
      process.stdout.write(
        `  ${color.bold(locale)} ${color.dim(`(${entries.length})`)}\n`,
      );
      let lastFileId = '';
      for (const entry of entries) {
        if (entry.fileId !== lastFileId) {
          process.stdout.write(`    ${color.dim(entry.fileId)}\n`);
          lastFileId = entry.fileId;
        }
        process.stdout.write(
          `      ${color.dim('—')} ${color.bold(entry.source)}\n`,
        );
      }
      process.stdout.write('\n');
    }
  }

  if (errors.length > 0) {
    printDiagnosticGroup({
      colorize: color.red,
      diagnostics: errors,
      label: `${errors.length} error${errors.length === 1 ? '' : 's'}`,
    });
  }

  if (warnings.length > 0) {
    printDiagnosticGroup({
      colorize: color.yellow,
      diagnostics: warnings,
      label: `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
    });
  }

  if (report.missing.length > 0) {
    let firstNonDefault = '';
    for (const locale of report.locales) {
      if (locale !== report.defaultLocale) {
        firstNonDefault = locale;
        break;
      }
    }
    process.stdout.write(
      `  ${color.dim('Run')} ${color.cyan(`yapyak add ${firstNonDefault}`)} ${color.dim('to translate, or fill in the locale file manually.')}\n\n`,
    );
  }

  if (errors.length > 0 || report.missing.length > 0) {
    return 1;
  }
  return 0;
}

function printDiagnosticGroup(input: {
  colorize: (text: string) => string;
  diagnostics: readonly Diagnostic[];
  label: string;
}): void {
  process.stdout.write(`  ${symbol.cross} ${input.colorize(input.label)}\n\n`);
  const sorted = [...input.diagnostics].sort((a, b) => {
    if (a.fileId !== b.fileId) {
      return a.fileId < b.fileId ? -1 : 1;
    }
    if (a.code !== b.code) {
      return a.code < b.code ? -1 : 1;
    }
    return a.range.start.offset - b.range.start.offset;
  });
  let lastFileId = '';
  for (const diagnostic of sorted) {
    if (diagnostic.fileId !== lastFileId) {
      process.stdout.write(`    ${color.dim(diagnostic.fileId)}\n`);
      lastFileId = diagnostic.fileId;
    }
    process.stdout.write(
      `      ${color.bold(diagnostic.code)} ${diagnostic.message}\n`,
    );
    if (diagnostic.hint) {
      process.stdout.write(`        ${color.dim(diagnostic.hint)}\n`);
    }
  }
  process.stdout.write('\n');
}
