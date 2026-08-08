import type { Diagnostic } from '../../compiler/internal';
import type { Config } from '../config';
import type { MissingEntry } from '../report';

import {
  YAP_COMPILE,
  findContextDiagnostics,
  readLocaleFile,
  validateIcuPairs,
} from '../../compiler/internal';
import { buildReport } from '../report';
import { color, header, symbol } from '../tui';
import { join } from 'node:path';

export function check(config: Config, projectRoot: string): number {
  const report = buildReport({
    defaultLocale: config.defaultLocale,
    exclude: config.exclude,
    include: config.include,
    localesDir: config.localesDir,
    processors: config.processors,
    projectRoot,
  });

  const localesPath = join(projectRoot, config.localesDir);
  const allDiagnostics: Diagnostic[] = [
    ...report.diagnostics,
  ];
  allDiagnostics.push(...findContextDiagnostics(report.messages));

  for (const locale of report.locales) {
    if (locale === report.defaultLocale) {
      continue;
    }
    const localeFilePath = join(localesPath, `${locale}.json`);
    const fileId = `${config.localesDir}/${locale}.json`;
    const hasParseFailure = report.diagnostics.some(
      (diagnostic) =>
        diagnostic.fileId === fileId &&
        diagnostic.code === YAP_COMPILE.CATALOG_INVALID_JSON.code,
    );
    if (hasParseFailure) {
      continue;
    }
    const localeFile = readLocaleFile(localeFilePath);
    allDiagnostics.push(
      ...validateIcuPairs(fileId, locale, localeFile, report.messages),
    );
  }

  const errors = allDiagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error',
  );
  const warnings = allDiagnostics.filter(
    (diagnostic) => diagnostic.severity === 'warning',
  );

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
    const byLocale: Record<string, MissingEntry[]> = {};
    for (const entry of report.missing) {
      const list = byLocale[entry.locale];
      if (list) {
        list.push(entry);
      } else {
        byLocale[entry.locale] = [
          entry,
        ];
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
        const label =
          entry.context === undefined
            ? color.bold(entry.source)
            : `${color.bold(entry.source)} ${color.dim(`· ${entry.context}`)}`;
        process.stdout.write(`      ${color.dim('—')} ${label}\n`);
      }
      process.stdout.write('\n');
    }
  }

  if (errors.length > 0) {
    printDiagnosticGroup(
      color.red,
      errors,
      `${errors.length} error${errors.length === 1 ? '' : 's'}`,
    );
  }

  if (warnings.length > 0) {
    printDiagnosticGroup(
      color.yellow,
      warnings,
      `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
    );
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

function printDiagnosticGroup(
  colorize: (text: string) => string,
  diagnostics: Diagnostic[],
  label: string,
): void {
  process.stdout.write(`  ${symbol.cross} ${colorize(label)}\n\n`);
  const sorted = [
    ...diagnostics,
  ].sort((a, b) => {
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
