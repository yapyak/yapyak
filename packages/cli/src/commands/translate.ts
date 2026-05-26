import type { Config } from '../config';

import { autoTranslate } from '@yapyak/compiler';

import { buildReport } from '../report';
import { color, header, progressBar, spinner, symbol } from '../tui';
import { wrapWithProgress } from '../wrap-with-progress';

interface TranslateOptions {
  config: Config;
  force?: boolean;
  locale?: string;
  projectRoot: string;
}

export async function translate(options: TranslateOptions): Promise<number> {
  const { config, force = false, locale: targetLocale, projectRoot } = options;

  const translator = config.translator;
  if (!translator) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('No translator configured.')}\n\n`,
    );
    process.stdout.write(
      `  ${color.dim('Add a translator to')} ${color.bold('yapyak.config.ts')}${color.dim(':')}\n\n`,
    );
    process.stdout.write(
      `    ${color.cyan("import { anthropic } from '@yapyak/anthropic';")}\n\n`,
    );
    process.stdout.write(`    ${color.cyan('export default {')}\n`);
    process.stdout.write(
      `    ${color.cyan('  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),')}\n`,
    );
    process.stdout.write(`    ${color.cyan('};')}\n\n`);
    return 1;
  }

  const report = buildReport({
    defaultLocale: config.defaultLocale,
    localesDir: config.localesDir,
    projectRoot,
  });
  const targetLocales = targetLocale
    ? [targetLocale]
    : report.locales.filter((locale) => locale !== report.defaultLocale);

  const stubsToFill = force
    ? targetLocales.flatMap((locale) =>
        report.messages.flatMap((message) =>
          message.locations.map((location) => ({
            fileId: location.fileId,
            locale,
            source: message.source,
          })),
        ),
      )
    : report.missing.filter((entry) => targetLocales.includes(entry.locale));

  process.stdout.write(
    header(
      `Translating via ${color.cyan(translator.id)}`,
      `${stubsToFill.length} stubs across ${targetLocales.join(', ')}`,
    ),
  );

  if (stubsToFill.length === 0) {
    process.stdout.write(
      `  ${symbol.check} ${color.green('Nothing to translate.')}\n\n`,
    );
    return 0;
  }

  const sp = spinner(
    `Translating ${color.bold(String(stubsToFill.length))} strings…`,
  );
  let done = 0;
  let failed = 0;
  const startedAt = Date.now();

  const onProgress = (count: number): void => {
    done += count;
    sp.update(
      `${color.bold(`${done}/${stubsToFill.length}`)} ${color.dim('·')} ${progressBar(done, stubsToFill.length, 24)}`,
    );
  };

  const localesToProcess = [...new Set(stubsToFill.map((s) => s.locale))];
  for (const locale of localesToProcess) {
    const subResult = await autoTranslate({
      defaultLocale: report.defaultLocale,
      force,
      locales: [report.defaultLocale, locale],
      localesDir: config.localesDir,
      messages: report.messages,
      projectRoot,
      translator: wrapWithProgress(translator, onProgress),
    });
    failed += subResult.errors.length;
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (failed === 0) {
    sp.succeed(`${done} translated · ${color.dim(`${elapsed}s`)}`);
  } else {
    sp.fail(
      `${done} translated · ${color.red(`${failed} failed`)} · ${color.dim(`${elapsed}s`)}`,
    );
  }

  process.stdout.write(
    `\n  ${color.dim('Review the locale files and tweak as needed.')}\n\n`,
  );
  return failed === 0 ? 0 : 1;
}
