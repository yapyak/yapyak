import type { Config } from '../config';

import { buildReport } from '../report';
import { color, header, symbol } from '../tui';

export interface CheckOptions {
  config: Config;
  projectRoot: string;
}

export function check(options: CheckOptions): number {
  const report = buildReport({
    defaultLocale: options.config.defaultLocale,
    localesDir: options.config.localesDir,
    projectRoot: options.projectRoot,
  });

  process.stdout.write(header('Translation check'));

  if (report.missing.length === 0) {
    const total = report.totalMessages * report.locales.length;
    process.stdout.write(
      `  ${symbol.check} ${color.green(`All ${total} translations present.`)}\n\n`,
    );
    return 0;
  }

  const byLocale: Record<string, typeof report.missing> = {};
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

  process.stdout.write(
    `  ${color.dim('Run')} ${color.cyan(`yapyak add ${Object.keys(byLocale)[0]}`)} ${color.dim('to translate, or fill in the locale file manually.')}\n\n`,
  );
  return 1;
}
