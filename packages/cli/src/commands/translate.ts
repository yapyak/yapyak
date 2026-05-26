import type { TranslateRequest, Translator } from '@yapyak/translator';
import type { YapyakCliConfig } from '../load-config';

import { anthropic } from '@yapyak/anthropic';
import { autoTranslate } from '@yapyak/compiler';
import { openai } from '@yapyak/openai';

import { collect } from '../collect';
import { loadEnv } from '../load-env';
import { color, header, progressBar, spinner, symbol } from '../tui';

export interface TranslateOptions {
  config: YapyakCliConfig;
  force?: boolean;
  locale?: string;
  projectRoot: string;
  provider?: 'anthropic' | 'openai';
}

export async function translate(options: TranslateOptions): Promise<number> {
  const { config, force = false, locale: targetLocale, projectRoot } = options;
  const env = loadEnv(projectRoot);

  const translator = pickTranslator(env, options.provider);
  if (translator === null) {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('No translator credentials found.')}\n\n`,
    );
    process.stdout.write(
      `  ${color.dim('Set one of these in')} ${color.bold('.env.local')}${color.dim(':')}\n\n`,
    );
    process.stdout.write(
      `    ${color.cyan('ANTHROPIC_API_KEY')}${color.dim('=…')}\n`,
    );
    process.stdout.write(
      `    ${color.cyan('OPENAI_API_KEY')}${color.dim('=…')}\n\n`,
    );
    process.stdout.write(
      `  ${color.dim('Or run')} ${color.cyan('yapyak init')} ${color.dim('to set up.')}\n\n`,
    );
    return 1;
  }

  const report = collect({
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
      `Translating via ${color.cyan(translator.providerName)}`,
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

  const localesToProcess = Array.from(
    new Set(stubsToFill.map((s) => s.locale)),
  );
  for (const locale of localesToProcess) {
    const subResult = await autoTranslate({
      defaultLocale: report.defaultLocale,
      force,
      locales: [report.defaultLocale, locale],
      localesDir: config.localesDir,
      messages: report.messages,
      projectRoot,
      translator: wrapWithProgress(translator.fn, onProgress),
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

function wrapWithProgress(
  base: Translator,
  onProgress: (count: number) => void,
): Translator {
  const wrapped: Translator = Object.assign(
    async (request: TranslateRequest) => {
      const value = await base(request);
      onProgress(1);
      return value;
    },
    { id: base.id },
  );
  if (typeof base.batch === 'function') {
    const batchFn = base.batch.bind(base);
    wrapped.batch = async (requests) => {
      const results = await batchFn(requests);
      onProgress(results.length);
      return results;
    };
  }
  return wrapped;
}

interface PickedTranslator {
  fn: Translator;
  providerName: string;
}

function pickTranslator(
  env: Record<string, string>,
  preferred?: 'anthropic' | 'openai',
): PickedTranslator | null {
  if (preferred === 'anthropic' || preferred === undefined) {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (apiKey) {
      return { fn: anthropic({ apiKey }), providerName: 'Anthropic' };
    }
  }
  if (preferred === 'openai' || preferred === undefined) {
    const apiKey = env.OPENAI_API_KEY;
    if (apiKey) {
      return { fn: openai({ apiKey }), providerName: 'OpenAI' };
    }
  }
  return null;
}
