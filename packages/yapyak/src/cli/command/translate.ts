import type { Config } from '../config';
import type { TranslationErrorEntry } from '../translation-error';

import { autoTranslate, validateLocaleCode } from '../../compiler/internal';
import { withProgress } from '../progress';
import { buildReport } from '../report';
import { renderTranslationErrors } from '../translation-error';
import { color, header, progressBar, spinner, symbol } from '../tui';

export type TranslateOptions = {
  force?: boolean;
  locale?: string;
};

export async function translate(
  config: Config,
  projectRoot: string,
  options?: TranslateOptions,
): Promise<number> {
  const force = options?.force ?? false;
  const targetLocale = options?.locale;

  if (targetLocale !== undefined) {
    const validation = validateLocaleCode(targetLocale);
    if (!validation.valid) {
      const hint = validation.suggestion
        ? ` ${color.dim('— did you mean')} ${color.cyan(validation.suggestion)}${color.dim('?')}`
        : '';
      process.stderr.write(
        `\n  ${symbol.cross} ${color.red(`Invalid locale code: ${color.bold(targetLocale)}.`)}${hint}\n  ${color.dim('Use a standard locale code (')}${color.cyan('en')}${color.dim(', ')}${color.cyan('sv')}${color.dim(', ')}${color.cyan('pt-BR')}${color.dim(', etc.) or a BCP 47 variant.')}\n\n`,
      );
      return 1;
    }
  }

  const translator = config.translator;
  if (!translator) {
    process.stderr.write(
      `\n  ${symbol.cross} ${color.red('No translator configured.')}\n\n`,
    );
    process.stderr.write(
      `  ${color.dim('Add a translator to')} ${color.bold('yapyak.config.ts')}${color.dim(':')}\n\n`,
    );
    process.stderr.write(
      `    ${color.cyan("import { anthropic } from '@yapyak/anthropic';")}\n\n`,
    );
    process.stderr.write(`    ${color.cyan('export default {')}\n`);
    process.stderr.write(
      `    ${color.cyan('  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),')}\n`,
    );
    process.stderr.write(`    ${color.cyan('};')}\n\n`);
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
  const targetLocales = targetLocale
    ? [
        targetLocale,
      ]
    : report.locales.filter((locale) => locale !== report.defaultLocale);

  const stubsToFill = force
    ? targetLocales.flatMap((locale) =>
        report.messages.map((message) => ({
          fileId: message.locations[0]?.fileId ?? '',
          locale,
          source: message.source,
        })),
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
  let aborted = false;
  const allErrors: TranslationErrorEntry[] = [];
  const startedAt = Date.now();

  const controller = new AbortController();
  const onSigint = (): void => {
    aborted = true;
    controller.abort(new Error('Translate cancelled by SIGINT.'));
  };
  process.once('SIGINT', onSigint);

  const onProgress = (count: number): void => {
    done += count;
    sp.update(
      `${color.bold(`${done}/${stubsToFill.length}`)} ${color.dim('·')} ${progressBar(done, stubsToFill.length, 24)}`,
    );
  };

  const localesToProcess = [
    ...new Set(stubsToFill.map((stub) => stub.locale)),
  ];
  try {
    const result = await autoTranslate(
      {
        messages: report.messages,
        translator: withProgress(translator, onProgress),
      },
      {
        defaultLocale: report.defaultLocale,
        locales: [
          report.defaultLocale,
          ...localesToProcess,
        ],
        localesDir: config.localesDir,
      },
      projectRoot,
      {
        examples: config.examples,
        force,
        signal: controller.signal,
      },
    );
    failed += result.errors.length;
    allErrors.push(...result.errors);
  } finally {
    process.off('SIGINT', onSigint);
    sp.stop();
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (aborted) {
    sp.fail(
      `${done} translated · ${color.red('cancelled')} · ${color.dim(`${elapsed}s`)}`,
    );
    process.stdout.write(
      `\n  ${color.dim('Partial results written. Re-run to resume.')}\n\n`,
    );
    return 130;
  }
  if (failed === 0) {
    sp.succeed(`${done} translated · ${color.dim(`${elapsed}s`)}`);
  } else {
    sp.fail(
      `${done} translated · ${color.red(`${failed} failed`)} · ${color.dim(`${elapsed}s`)}`,
    );
  }

  if (allErrors.length > 0) {
    process.stdout.write(renderTranslationErrors(allErrors));
  }

  process.stdout.write(
    `\n  ${color.dim('Review the locale files and tweak as needed.')}\n\n`,
  );
  return failed === 0 ? 0 : 1;
}
