import { collect } from '../collect.js';
import type { YapyakCliConfig } from '../load-config.js';
import { color, header, symbol } from '../tui.js';

export interface CheckOptions {
  config: YapyakCliConfig;
  projectRoot: string;
}

export function check(options: CheckOptions): number {
  const result = collect({
    defaultLocale: options.config.defaultLocale,
    localesDir: options.config.localesDir,
    projectRoot: options.projectRoot,
  });

  process.stdout.write(header('Translation check'));

  if (result.missing.length === 0) {
    const total = result.totalMessages * result.locales.length;
    process.stdout.write(
      `  ${symbol.check} ${color.green(`All ${total} translations present.`)}\n\n`,
    );
    return 0;
  }

  const byLocale: Record<string, typeof result.missing> = {};
  for (const entry of result.missing) {
    const list = byLocale[entry.locale];
    if (list === undefined) {
      byLocale[entry.locale] = [entry];
    } else {
      list.push(entry);
    }
  }

  process.stdout.write(
    `  ${symbol.cross} ${color.red(`${result.missing.length} missing translations`)}\n\n`,
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
