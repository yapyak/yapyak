import type { Config } from '../config';
import type { TranslationErrorEntry } from '../translation-error';

import {
  autoTranslate,
  getDefaultYapyakDir,
  validateLocaleCode,
  writeRegister,
} from '../../compiler';
import { withProgress } from '../progress';
import { buildReport } from '../report';
import { renderTranslationErrors } from '../translation-error';
import { color, header, progressBar, spinner, symbol } from '../tui';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type AddOptions = {
  locales: string[];
};

export async function add(
  config: Config,
  projectRoot: string,
  options: AddOptions,
): Promise<number> {
  const { locales } = options;
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

  const invalid: Array<{
    code: string;
    suggestion?: string;
  }> = [];
  for (const code of locales) {
    const result = validateLocaleCode(code);
    if (!result.valid) {
      invalid.push({
        code,
        suggestion: result.suggestion,
      });
    }
  }
  if (invalid.length > 0) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('Invalid locale code.')}\n\n`,
    );
    for (const entry of invalid) {
      const hint = entry.suggestion
        ? ` ${color.dim('— did you mean')} ${color.cyan(entry.suggestion)}${color.dim('?')}`
        : '';
      process.stdout.write(
        `    ${color.bold(entry.code)} is not a recognized ISO 639-1 language code.${hint}\n`,
      );
    }
    process.stdout.write(
      `\n  ${color.dim('Use a standard locale code (')}${color.cyan('en')}${color.dim(', ')}${color.cyan('sv')}${color.dim(', ')}${color.cyan('pt-BR')}${color.dim(', etc.) or a BCP 47 variant.')}\n\n`,
    );
    return 1;
  }

  const localesDirAbs = join(projectRoot, config.localesDir);
  if (!existsSync(localesDirAbs)) {
    mkdirSync(localesDirAbs, {
      recursive: true,
    });
  }

  const labelLine = locales.map((locale) => color.cyan(locale)).join(', ');
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

  const { defaultLocale } = config;
  const allLocales = readdirSync(localesDirAbs)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));
  if (!allLocales.includes(defaultLocale)) {
    allLocales.unshift(defaultLocale);
  }
  writeRegister(allLocales, getDefaultYapyakDir(projectRoot));

  const report = buildReport({
    defaultLocale: config.defaultLocale,
    exclude: config.exclude,
    include: config.include,
    localesDir: config.localesDir,
    processors: config.processors,
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
  const allErrors: TranslationErrorEntry[] = [];
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

    const subResult = await autoTranslate(
      {
        messages: report.messages,
        translator: withProgress(translator, onProgress),
      },
      {
        defaultLocale: report.defaultLocale,
        locales: [
          report.defaultLocale,
          locale,
        ],
        localesDir: config.localesDir,
      },
      projectRoot,
      {
        examples: config.examples,
      },
    );

    totalDone += done;
    totalFailed += subResult.errors.length;
    allErrors.push(...subResult.errors);

    if (subResult.errors.length === 0) {
      sp.succeed(`${color.bold(locale)} ${color.dim('·')} ${done} translated`);
    } else {
      sp.fail(
        `${color.bold(locale)} ${color.dim('·')} ${done} translated · ${color.red(`${subResult.errors.length} failed`)}`,
      );
    }
  }

  if (allErrors.length > 0) {
    process.stdout.write(renderTranslationErrors(allErrors));
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(
    `\n  ${color.dim(`Total: ${totalDone} translated · ${elapsed}s`)}\n\n`,
  );

  return totalFailed === 0 ? 0 : 1;
}
