import { collect } from '../collect.js';
import { color, header, progressBar, renderTable, symbol } from '../tui.js';

export interface StatusOptions {
  json?: boolean;
  projectRoot: string;
}

export function status(options: StatusOptions): number {
  const result = collect({ projectRoot: options.projectRoot });

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.missing.length === 0 ? 0 : 1;
  }

  const total = result.totalMessages;
  const localesLine = result.locales
    .map((locale) =>
      locale === result.defaultLocale
        ? `${color.bold(locale)} ${color.dim('(default)')}`
        : color.bold(locale),
    )
    .join(` ${color.dim('·')} `);

  process.stdout.write(header('Translation status'));
  process.stdout.write(
    `  ${color.dim('Locales')}   ${localesLine}\n`,
  );
  process.stdout.write(
    `  ${color.dim('Total')}     ${color.bold(String(total))} messages × ${result.locales.length} = ${color.bold(
      String(total * result.locales.length),
    )} translations\n\n`,
  );

  const rows = result.locales.map((locale) => {
    const stats = result.perLocale[locale];
    const translated = stats?.translated ?? 0;
    const ratio = total === 0 ? 1 : translated / total;
    const percent = `${Math.round(ratio * 100)}%`;
    return [
      locale === result.defaultLocale ? `${locale} ${color.dim('(default)')}` : locale,
      `${translated} / ${total}`,
      `${progressBar(translated, total, 20)}  ${percent}`,
    ];
  });

  process.stdout.write(
    `${renderTable({
      align: ['left', 'right', 'left'],
      headers: [color.bold('Locale'), color.bold('Coverage'), ''],
      rows,
    })
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n')}\n\n`,
  );

  if (result.missing.length === 0) {
    process.stdout.write(
      `  ${symbol.check} ${color.green('All translations present.')}\n\n`,
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

  for (const [locale, entries] of Object.entries(byLocale)) {
    process.stdout.write(
      `  ${symbol.warn} ${color.yellow(`${entries.length} missing in ${color.bold(locale)}`)}\n\n`,
    );
    const limit = 10;
    const shown = entries.slice(0, limit);
    let lastFileId = '';
    for (const entry of shown) {
      if (entry.fileId !== lastFileId) {
        process.stdout.write(`    ${color.dim(entry.fileId)}\n`);
        lastFileId = entry.fileId;
      }
      process.stdout.write(
        `      ${color.dim('—')} ${color.bold(entry.source)}\n`,
      );
    }
    if (entries.length > limit) {
      process.stdout.write(
        `    ${color.dim(`…and ${entries.length - limit} more`)}\n`,
      );
    }
    process.stdout.write('\n');
  }

  process.stdout.write(
    `  ${color.dim('Run')} ${color.cyan(`yapyak add ${Object.keys(byLocale)[0]}`)} ${color.dim('to translate, or fill in the locale file manually.')}\n\n`,
  );
  return 1;
}
