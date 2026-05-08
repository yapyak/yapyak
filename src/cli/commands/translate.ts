import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  anthropicProvider,
  type AnthropicModel,
  openaiProvider,
  type OpenAiModel,
  type TranslateFunction,
} from '../../ai/index.js';
import { loadConfig } from '../config.js';

export interface TranslateOptions {
  forceAll: boolean;
}

export interface TranslateResult {
  locale: string;
  translated: number;
}

export async function runTranslate(
  projectRoot: string,
  options: TranslateOptions,
): Promise<TranslateResult[]> {
  const config = loadConfig(projectRoot);
  if (!config.ai) {
    throw new Error(
      'No `ai` config found. Set `ai: { provider, apiKey }` in the yapyak plugin and start your dev server once.',
    );
  }

  const translate = buildTranslator(config.ai);

  const sourcePath = join(
    projectRoot,
    config.localesDir,
    `${config.defaultLocale}.json`,
  );
  const sourceTranslations = readJson(sourcePath);

  const results: TranslateResult[] = [];

  for (const locale of config.locales) {
    if (locale === config.defaultLocale) {
      continue;
    }
    const targetPath = join(projectRoot, config.localesDir, `${locale}.json`);
    const existing = readJson(targetPath);
    const next: Record<string, Record<string, string>> = {};
    let translated = 0;

    for (const [fileId, sources] of Object.entries(sourceTranslations)) {
      const fileTranslations: Record<string, string> = {};
      for (const [source, sourceValue] of Object.entries(sources)) {
        if (!options.forceAll && existing[fileId]?.[source] !== undefined) {
          fileTranslations[source] = existing[fileId][source];
          continue;
        }
        process.stdout.write(
          `  ${locale}: translating "${truncate(source, 50)}"...\n`,
        );
        const translation = await translate({
          defaultLocale: config.defaultLocale,
          fileId,
          glossary: config.ai.glossary,
          source: sourceValue,
          targetLocale: locale,
          voice: config.ai.voice,
        });
        fileTranslations[source] = translation;
        translated++;
      }
      next[fileId] = fileTranslations;
    }

    writeJson(targetPath, next);
    results.push({ locale, translated });
  }

  return results;
}

function buildTranslator(ai: NonNullable<ReturnType<typeof loadConfig>['ai']>): TranslateFunction {
  if (ai.provider === 'anthropic') {
    return anthropicProvider({
      apiKey: ai.apiKey,
      model: ai.model as AnthropicModel | undefined,
    });
  }
  if (ai.provider === 'openai') {
    return openaiProvider({
      apiKey: ai.apiKey,
      model: ai.model as OpenAiModel | undefined,
    });
  }
  throw new Error(`Unknown AI provider: ${String(ai.provider)}`);
}

function readJson(path: string): Record<string, Record<string, string>> {
  if (!existsSync(path)) {
    return {};
  }
  const raw = readFileSync(path, 'utf8');
  if (raw.trim() === '') {
    return {};
  }
  return JSON.parse(raw);
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function truncate(input: string, max: number): string {
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, max - 1)}…`;
}
