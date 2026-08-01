import type { ExtractedMessage } from '../../compiler/internal';
import type { Config } from '../config';
import type { TranslationErrorEntry } from '../translation-error';

import { autoTranslate, validateLocaleCode } from '../../compiler/internal';
import { withProgress } from '../progress';
import { buildReport } from '../report';
import { renderTranslationErrors } from '../translation-error';
import { color, header, progressBar, spinner, symbol } from '../tui';

export type RetranslateOptions = {
  as?: string;
  file?: string;
  locale?: string;
};

export async function retranslate(
  config: Config,
  projectRoot: string,
  source: string,
  options?: RetranslateOptions,
): Promise<number> {
  if (source === '') {
    process.stderr.write(
      `\n  ${symbol.cross} ${color.red('Missing source string.')}\n  ${color.dim('Usage: ')}${color.cyan('yapyak retranslate <source> [--locale <code>] [--as <ctx>] [--file <path>]')}\n\n`,
    );
    return 1;
  }

  const targetLocale = options?.locale;
  if (targetLocale !== undefined) {
    const validation = validateLocaleCode(targetLocale);
    if (!validation.valid) {
      const hint = validation.suggestion
        ? ` ${color.dim('— did you mean')} ${color.cyan(validation.suggestion)}${color.dim('?')}`
        : '';
      process.stderr.write(
        `\n  ${symbol.cross} ${color.red(`Invalid locale code: ${color.bold(targetLocale)}.`)}${hint}\n\n`,
      );
      return 1;
    }
  }

  const translator = config.translator;
  if (!translator) {
    process.stderr.write(
      `\n  ${symbol.cross} ${color.red('No translator configured.')}\n  ${color.dim('Add a translator to')} ${color.bold('yapyak.config.ts')}${color.dim('.')}\n\n`,
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

  const requestedAs = options?.as;
  const requestedFile = options?.file;
  const matching: ExtractedMessage[] = [];
  for (const message of report.messages) {
    if (message.source !== source) {
      continue;
    }
    if (requestedAs !== undefined && message.context !== requestedAs) {
      continue;
    }
    const locations =
      requestedFile === undefined
        ? message.locations
        : message.locations.filter(
            (location) => location.fileId === requestedFile,
          );
    if (locations.length === 0) {
      continue;
    }
    matching.push({
      ...message,
      locations,
    });
  }

  const detailParts: string[] = [];
  if (requestedAs !== undefined) {
    detailParts.push(`${color.dim('as')} ${color.cyan(requestedAs)}`);
  }
  if (requestedFile !== undefined) {
    detailParts.push(`${color.dim('in')} ${color.cyan(requestedFile)}`);
  }
  const detail = detailParts.length === 0 ? '' : ` ${detailParts.join(' ')}`;

  if (matching.length === 0) {
    process.stdout.write(
      header('Re-translating', `${color.bold(`"${source}"`)}${detail}`),
    );
    process.stdout.write(
      `  ${symbol.check} ${color.green('No matching call sites.')}\n\n`,
    );
    return 0;
  }

  const targetLocales = targetLocale
    ? [
        targetLocale,
      ]
    : report.locales.filter((locale) => locale !== report.defaultLocale);

  const callSiteCount = matching.reduce(
    (sum, message) => sum + message.locations.length,
    0,
  );
  const total = callSiteCount * targetLocales.length;
  process.stdout.write(
    header(
      `Re-translating via ${color.cyan(translator.id)}`,
      `${color.bold(`"${source}"`)}${detail} ${color.dim('·')} ${callSiteCount} call ${callSiteCount === 1 ? 'site' : 'sites'} across ${targetLocales.join(', ')}`,
    ),
  );

  const activeSpinner = spinner(
    `Re-translating ${color.bold(String(total))} entries…`,
  );
  let done = 0;
  let failed = 0;
  let wasAborted = false;
  const allErrors: TranslationErrorEntry[] = [];
  const startedAt = Date.now();

  const controller = new AbortController();
  const handleSigint = (): void => {
    wasAborted = true;
    controller.abort(new Error('Retranslate cancelled by SIGINT.'));
  };
  process.once('SIGINT', handleSigint);

  const handleProgress = (count: number): void => {
    done += count;
    activeSpinner.update(
      `${color.bold(`${done}/${total}`)} ${color.dim('·')} ${progressBar(done, total, 24)}`,
    );
  };

  try {
    const result = await autoTranslate(
      {
        messages: matching,
        translator: withProgress(translator, handleProgress),
      },
      {
        defaultLocale: report.defaultLocale,
        locales: [
          report.defaultLocale,
          ...targetLocales,
        ],
        localesDir: config.localesDir,
      },
      projectRoot,
      {
        examples: config.examples,
        force: true,
        signal: controller.signal,
      },
    );
    failed += result.errors.length;
    allErrors.push(...result.errors);
  } finally {
    process.off('SIGINT', handleSigint);
    activeSpinner.stop();
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (wasAborted) {
    activeSpinner.fail(
      `${done} re-translated · ${color.red('cancelled')} · ${color.dim(`${elapsed}s`)}`,
    );
    return 130;
  }
  if (failed === 0) {
    activeSpinner.succeed(
      `${done} re-translated · ${color.dim(`${elapsed}s`)}`,
    );
  } else {
    activeSpinner.fail(
      `${done} re-translated · ${color.red(`${failed} failed`)} · ${color.dim(`${elapsed}s`)}`,
    );
  }

  if (allErrors.length > 0) {
    process.stdout.write(renderTranslationErrors(allErrors));
  }

  process.stdout.write('\n');
  return failed === 0 ? 0 : 1;
}
