import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { anthropic } from '../../translators/anthropic.js';
import { openai } from '../../translators/openai.js';
import type { Translator } from '../../translators/types.js';
import { autoTranslate } from '../../vite/auto-translate.js';
import { collect } from '../collect.js';
import { loadEnv } from '../load-env.js';
import { color, header, progressBar, spinner, symbol } from '../tui.js';

export interface AddOptions {
  locale: string;
  projectRoot: string;
}

export async function add(options: AddOptions): Promise<number> {
  const { locale, projectRoot } = options;

  if (locale === '') {
    process.stdout.write(
      `\n  ${symbol.cross} ${color.red('Locale code required.')}\n`,
    );
    process.stdout.write(
      `  ${color.dim('Example:')} ${color.cyan('yapyak add fr')}\n\n`,
    );
    return 1;
  }

  const localesDir = join(projectRoot, 'locales');
  const localePath = join(localesDir, `${locale}.yml`);

  process.stdout.write(header(`Adding locale: ${color.cyan(locale)}`));

  if (!existsSync(localesDir)) {
    mkdirSync(localesDir, { recursive: true });
  }

  if (existsSync(localePath)) {
    process.stdout.write(
      `  ${symbol.warn} ${color.yellow(`locales/${locale}.yml already exists — leaving it alone.`)}\n`,
    );
  } else {
    writeFileSync(localePath, '');
    process.stdout.write(
      `  ${symbol.check} Created ${color.bold(`locales/${locale}.yml`)}\n`,
    );
  }

  let result;
  try {
    result = collect({ projectRoot });
  } catch {
    process.stdout.write(
      `\n  ${color.dim('No source schemas found yet — locale file is ready for')} ${color.cyan('pnpm dev')}${color.dim('.')}\n\n`,
    );
    return 0;
  }

  const stats = result.perLocale[locale];
  const missing = stats?.missing ?? result.totalMessages;

  if (missing === 0) {
    process.stdout.write(
      `\n  ${symbol.check} ${color.green('All translations present already.')}\n\n`,
    );
    return 0;
  }

  const env = loadEnv(projectRoot);
  const translator = pickTranslator(env);

  if (translator === null) {
    process.stdout.write(
      `\n  ${color.dim(`${missing} strings need translation.`)}\n`,
    );
    process.stdout.write(
      `\n  ${color.dim('Set')} ${color.cyan('ANTHROPIC_API_KEY')} ${color.dim('or')} ${color.cyan('OPENAI_API_KEY')} ${color.dim('in')} ${color.bold('.env.local')} ${color.dim('to auto-translate,')}\n`,
    );
    process.stdout.write(
      `  ${color.dim('or fill in')} ${color.bold(`locales/${locale}.yml`)} ${color.dim('by hand.')}\n\n`,
    );
    return 0;
  }

  process.stdout.write(
    `\n  ${color.dim('Found')} ${color.cyan(translator.providerName)} ${color.dim('credentials. Translating')} ${color.bold(String(missing))} ${color.dim('strings…')}\n\n`,
  );

  const sp = spinner(
    `Translating ${color.bold(String(missing))} strings…`,
  );
  let done = 0;
  const startedAt = Date.now();
  const onProgress = (count: number): void => {
    done += count;
    sp.update(
      `${color.bold(`${done}/${missing}`)} ${color.dim('·')} ${progressBar(done, missing, 24)}`,
    );
  };

  const translateResult = await autoTranslate({
    defaultLocale: result.defaultLocale,
    locales: [result.defaultLocale, locale],
    localesDir: 'locales',
    messages: result.messages,
    projectRoot,
    translator: wrapWithProgress(translator.fn, onProgress),
  });

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (translateResult.errors.length === 0) {
    sp.succeed(
      `${done} translated · ${color.dim(`${elapsed}s`)}`,
    );
  } else {
    sp.fail(
      `${done} translated · ${color.red(`${translateResult.errors.length} failed`)} · ${color.dim(`${elapsed}s`)}`,
    );
  }

  process.stdout.write(
    `\n  ${color.dim('Review')} ${color.bold(`locales/${locale}.yml`)} ${color.dim('and tweak as needed.')}\n\n`,
  );

  return translateResult.errors.length === 0 ? 0 : 1;
}

function wrapWithProgress(
  base: Translator,
  onProgress: (count: number) => void,
): Translator {
  const wrapped: Translator = async (request) => {
    const value = await base(request);
    onProgress(1);
    return value;
  };
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
): PickedTranslator | null {
  const anthropicKey = env.ANTHROPIC_API_KEY;
  if (anthropicKey !== undefined && anthropicKey !== '') {
    return { fn: anthropic({ apiKey: anthropicKey }), providerName: 'Anthropic' };
  }
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey !== undefined && openaiKey !== '') {
    return { fn: openai({ apiKey: openaiKey }), providerName: 'OpenAI' };
  }
  return null;
}
