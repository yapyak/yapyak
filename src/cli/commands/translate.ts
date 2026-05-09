import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  type AnthropicModel,
  anthropicProvider,
  type OpenAiModel,
  openaiProvider,
  type Provider,
} from '../../ai/index.js';
import { type CachedAi, loadConfig } from '../config.js';

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

  const provider = buildProvider(config.ai);

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

    interface MissingItem {
      fileId: string;
      source: string;
      sourceValue: string;
    }
    const missing: MissingItem[] = [];

    for (const [fileId, sources] of Object.entries(sourceTranslations)) {
      const fileTranslations: Record<string, string> = {};
      for (const [source, sourceValue] of Object.entries(sources)) {
        if (!options.forceAll && existing[fileId]?.[source] !== undefined) {
          fileTranslations[source] = existing[fileId][source];
          continue;
        }
        missing.push({ fileId, source, sourceValue });
      }
      next[fileId] = fileTranslations;
    }

    let translated = 0;

    if (missing.length === 0) {
      writeJson(targetPath, next);
      results.push({ locale, translated });
      continue;
    }

    process.stdout.write(
      `  ${locale}: ${missing.length} string${missing.length === 1 ? '' : 's'} to translate...\n`,
    );

    const translations = await translateAll({
      ai: config.ai,
      defaultLocale: config.defaultLocale,
      missing,
      provider,
      targetLocale: locale,
    });

    for (let i = 0; i < missing.length; i++) {
      const item = missing[i];
      const translation = translations[i];
      if (item && translation !== undefined) {
        const fileTranslations = next[item.fileId] ?? {};
        fileTranslations[item.source] = translation;
        next[item.fileId] = fileTranslations;
        translated++;
      }
    }

    writeJson(targetPath, next);
    results.push({ locale, translated });
  }

  return results;
}

interface TranslateAllArgs {
  ai: CachedAi;
  defaultLocale: string;
  missing: Array<{ fileId: string; source: string; sourceValue: string }>;
  provider: Provider;
  targetLocale: string;
}

async function translateAll(
  args: TranslateAllArgs,
): Promise<Array<string | undefined>> {
  const { ai, defaultLocale, missing, provider, targetLocale } = args;
  const sources = missing.map((item) => item.sourceValue);

  if (provider.translateBatch && sources.length > 1) {
    try {
      const batch = await provider.translateBatch({
        defaultLocale,
        glossary: ai.glossary,
        sources,
        targetLocale,
        voice: ai.voice,
      });
      process.stdout.write(`  ✔ batched (1 request)\n`);
      return batch;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(
        `  ⚠ batch failed (${message}), falling back to one-by-one\n`,
      );
    }
  }

  const results: Array<string | undefined> = [];
  for (const item of missing) {
    process.stdout.write(`    ↪ "${truncate(item.source, 50)}"\n`);
    try {
      const translation = await provider.translate({
        defaultLocale,
        fileId: item.fileId,
        glossary: ai.glossary,
        source: item.sourceValue,
        targetLocale,
        voice: ai.voice,
      });
      results.push(translation);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`    ✗ failed: ${message}\n`);
      results.push(undefined);
    }
  }
  return results;
}

function buildProvider(ai: CachedAi): Provider {
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
