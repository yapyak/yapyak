import type { Config } from '../config';

import { autoTranslate } from '@yapyak/compiler';

import { buildReport } from '../report';
import { color, header, progressBar, spinner, symbol } from '../tui';
import { wrapWithProgress } from '../wrap-with-progress';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface AddOptions {
  config: Config;
  locales: string[];
  projectRoot: string;
}

export async function add(options: AddOptions): Promise<number> {
  const { config, locales, projectRoot } = options;

  if (locales.length === 0) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('Locale code required.')}\n`,
    );
    process.stdout.write(
      `  ${color.dim('Example:')} ${color.cyan('yapyak add fr')}\n`,
    );
    process.stdout.write(
      `  ${color.dim('Or multiple:')} ${color.cyan('yapyak add fr de sv')}\n\n`,
    );
    return 1;
  }

  const localesDirAbs = join(projectRoot, config.localesDir);
  if (!existsSync(localesDirAbs)) {
    mkdirSync(localesDirAbs, { recursive: true });
  }

  const labelLine = locales.map((l) => color.cyan(l)).join(', ');
  process.stdout.write(header(`Adding locales: ${labelLine}`));

  for (const locale of locales) {
    const localePath = join(localesDirAbs, `${locale}.json`);
    if (existsSync(localePath)) {
      process.stdout.write(
        `  ${symbol.warn} ${color.yellow(`${config.localesDir}/${locale}.json already exists — leaving it alone.`)}\n`,
      );
    } else {
      writeFileSync(localePath, '');
      process.stdout.write(
        `  ${symbol.check} Created ${color.bold(`${config.localesDir}/${locale}.json`)}\n`,
      );
    }
  }

  const report = buildReport({
    defaultLocale: config.defaultLocale,
    localesDir: config.localesDir,
    projectRoot,
  });

  if (report.totalMessages === 0) {
    process.stdout.write(
      `\n  ${color.dim('No source strings found yet — locale files are ready for')} ${color.cyan('pnpm dev')}${color.dim('.')}\n\n`,
    );
    return 0;
  }

  let totalMissing = 0;
  for (const locale of locales) {
    const stats = report.perLocale[locale];
    totalMissing += stats?.missing ?? report.totalMessages;
  }

  if (totalMissing === 0) {
    process.stdout.write(
      `\n  ${symbol.check} ${color.green('All translations present already.')}\n\n`,
    );
    return 0;
  }

  const translator = config.translator;
  if (!translator) {
    process.stdout.write(
      `\n  ${color.dim(`${totalMissing} strings need translation.`)}\n`,
    );
    process.stdout.write(
      `\n  ${color.dim('Add a translator to')} ${color.bold('yapyak.config.ts')} ${color.dim('to auto-translate,')}\n`,
    );
    process.stdout.write(
      `  ${color.dim('or fill in the locale files by hand.')}\n\n`,
    );
    return 0;
  }

  process.stdout.write(
    `\n  ${color.dim('Translating')} ${color.bold(String(totalMissing))} ${color.dim('strings via')} ${color.cyan(translator.id)}${color.dim('…')}\n\n`,
  );

  let totalDone = 0;
  let totalFailed = 0;
  const startedAt = Date.now();

  for (const locale of locales) {
    const stats = report.perLocale[locale];
    const missing = stats?.missing ?? report.totalMessages;
    if (missing === 0) {
      process.stdout.write(
        `  ${symbol.check} ${color.bold(locale)} ${color.dim('already complete')}\n`,
      );
      continue;
    }

    const sp = spinner(
      `${color.bold(locale)} ${color.dim('·')} translating ${color.bold(String(missing))} strings…`,
    );
    let done = 0;
    const onProgress = (count: number): void => {
      done += count;
      sp.update(
        `${color.bold(locale)} ${color.dim('·')} ${color.bold(`${done}/${missing}`)} ${color.dim('·')} ${progressBar(done, missing, 24)}`,
      );
    };

    const subResult = await autoTranslate({
      defaultLocale: report.defaultLocale,
      locales: [report.defaultLocale, locale],
      localesDir: config.localesDir,
      messages: report.messages,
      projectRoot,
      translator: wrapWithProgress(translator, onProgress),
    });

    totalDone += done;
    totalFailed += subResult.errors.length;

    if (subResult.errors.length === 0) {
      sp.succeed(`${color.bold(locale)} ${color.dim('·')} ${done} translated`);
    } else {
      sp.fail(
        `${color.bold(locale)} ${color.dim('·')} ${done} translated · ${color.red(`${subResult.errors.length} failed`)}`,
      );
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(
    `\n  ${color.dim(`Total: ${totalDone} translated · ${elapsed}s`)}\n\n`,
  );

  return totalFailed === 0 ? 0 : 1;
}
