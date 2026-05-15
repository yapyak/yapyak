import type { Translator } from '../../translator/index.js';
import type { YapyakCliConfig } from '../load-config.js';

import { anthropic } from '../../translator/anthropic.js';
import { openai } from '../../translator/openai.js';
import { autoTranslate } from '../../vite/auto-translate.js';
import { collect } from '../collect.js';
import { loadEnv } from '../load-env.js';
import { color, header, progressBar, spinner, symbol } from '../tui.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AddOptions {
  config: YapyakCliConfig;
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

  let result: ReturnType<typeof collect>;
  try {
    result = collect({
      defaultLocale: config.defaultLocale,
      localesDir: config.localesDir,
      projectRoot,
    });
  } catch {
    process.stdout.write(
      `\n  ${color.dim('No source strings found yet — locale files are ready for')} ${color.cyan('pnpm dev')}${color.dim('.')}\n\n`,
    );
    return 0;
  }

  let totalMissing = 0;
  for (const locale of locales) {
    const stats = result.perLocale[locale];
    totalMissing += stats?.missing ?? result.totalMessages;
  }

  if (totalMissing === 0) {
    process.stdout.write(
      `\n  ${symbol.check} ${color.green('All translations present already.')}\n\n`,
    );
    return 0;
  }

  const env = loadEnv(projectRoot);
  const translator = pickTranslator(env);

  if (translator === null) {
    process.stdout.write(
      `\n  ${color.dim(`${totalMissing} strings need translation.`)}\n`,
    );
    process.stdout.write(
      `\n  ${color.dim('Set')} ${color.cyan('ANTHROPIC_API_KEY')} ${color.dim('or')} ${color.cyan('OPENAI_API_KEY')} ${color.dim('in')} ${color.bold('.env.local')} ${color.dim('to auto-translate,')}\n`,
    );
    process.stdout.write(
      `  ${color.dim('or fill in the locale files by hand.')}\n\n`,
    );
    return 0;
  }

  process.stdout.write(
    `\n  ${color.dim('Found')} ${color.cyan(translator.providerName)} ${color.dim('credentials. Translating')} ${color.bold(String(totalMissing))} ${color.dim('strings…')}\n\n`,
  );

  let totalDone = 0;
  let totalFailed = 0;
  const startedAt = Date.now();

  for (const locale of locales) {
    const stats = result.perLocale[locale];
    const missing = stats?.missing ?? result.totalMessages;
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
      defaultLocale: result.defaultLocale,
      locales: [result.defaultLocale, locale],
      localesDir: config.localesDir,
      messages: result.messages,
      projectRoot,
      translator: wrapWithProgress(translator.fn, onProgress),
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

function pickTranslator(env: Record<string, string>): PickedTranslator | null {
  const anthropicKey = env.ANTHROPIC_API_KEY;
  if (anthropicKey !== undefined && anthropicKey !== '') {
    return {
      fn: anthropic({ apiKey: anthropicKey }),
      providerName: 'Anthropic',
    };
  }
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey !== undefined && openaiKey !== '') {
    return { fn: openai({ apiKey: openaiKey }), providerName: 'OpenAI' };
  }
  return null;
}
