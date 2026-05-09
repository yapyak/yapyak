import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import type { Provider, TranslationContext } from '../ai/index.js';
import { extractMessages, type MessageContext } from '../compiler/index.js';
import { detectRenames, type MessagePosition } from './detect-renames.js';
import { findBareBindings } from './find-bare-bindings.js';
import { loadPositionCache, savePositionCache } from './position-cache.js';

export interface AutoTranslateOptions {
  defaultLocale: string;
  factories: string[];
  glossary: Record<string, Record<string, string>>;
  intlModules: string[];
  locales: string[];
  localesDir: string;
  projectRoot: string;
  provider: Provider;
  voice: string;
}

export interface AutoTranslator {
  onSourceFileChange: (absolutePath: string) => Promise<boolean>;
}

export function createAutoTranslator(
  options: AutoTranslateOptions,
): AutoTranslator {
  const factoryNames = new Set(options.factories);
  const intlModules = new Set(options.intlModules);
  const inflight = new Set<string>();

  async function onSourceFileChange(absolutePath: string): Promise<boolean> {
    if (!/\.(?:tsx?|jsx?|mjs|cjs|vue|svelte)$/.test(absolutePath)) {
      return false;
    }
    if (!absolutePath.startsWith(options.projectRoot)) {
      return false;
    }
    if (!existsSync(absolutePath)) {
      return false;
    }

    const fileId = relative(options.projectRoot, absolutePath)
      .split(sep)
      .join('/');

    if (inflight.has(fileId)) {
      return false;
    }

    const code = readFileSync(absolutePath, 'utf8');
    const bareNames = findBareBindings({ code, intlModules });
    const extracted = extractMessages({
      bareNames,
      code,
      factoryNames,
      fileId,
    });

    const newPositions: MessagePosition[] = extracted.map((message) => ({
      column: message.column,
      line: message.line,
      source: message.source,
    }));

    const sources = new Set<string>();
    const contextBySource = new Map<string, MessageContext>();
    for (const message of extracted) {
      sources.add(message.source);
      if (!contextBySource.has(message.source)) {
        contextBySource.set(message.source, message.context);
      }
    }

    if (sources.size === 0) {
      return false;
    }

    const positionCache = loadPositionCache(options.projectRoot);
    const oldPositions = positionCache[fileId] ?? [];
    const renames = detectRenames(oldPositions, newPositions);

    if (renames.length > 0) {
      applyRenames({
        defaultLocale: options.defaultLocale,
        fileId,
        locales: options.locales,
        localesDir: options.localesDir,
        projectRoot: options.projectRoot,
        renames,
      });
      for (const rename of renames) {
        process.stdout.write(
          `[yapyak] ↻ "${rename.from}" → "${rename.to}" (rename detected, reusing translations)\n`,
        );
      }
    }

    positionCache[fileId] = newPositions;
    savePositionCache(options.projectRoot, positionCache);

    const sourcePath = sourceLocalePath(options);
    const sourceJson = readJson(sourcePath);
    const previousFile = sourceJson[fileId] ?? {};
    const nextFile: Record<string, string> = {};
    let added = false;
    for (const source of sources) {
      const existing = previousFile[source];
      nextFile[source] = existing ?? source;
      if (existing === undefined) {
        added = true;
      }
    }
    sourceJson[fileId] = nextFile;
    if (added) {
      writeJson(sourcePath, sortFiles(sourceJson));
    }

    let didTranslate = false;
    inflight.add(fileId);
    try {
      for (const locale of options.locales) {
        if (locale === options.defaultLocale) {
          continue;
        }
        const localePath = otherLocalePath(options, locale);
        const localeJson = readJson(localePath);
        const localeFile = localeJson[fileId] ?? {};
        const missing: string[] = [];
        for (const source of sources) {
          if (localeFile[source] === undefined) {
            missing.push(source);
          }
        }
        if (missing.length === 0) {
          continue;
        }
        process.stdout.write(
          `[yapyak] translating ${missing.length} string${missing.length === 1 ? '' : 's'} → ${locale}\n`,
        );

        const translations = await translateMissing({
          contextBySource,
          fileId,
          locale,
          missing,
          options,
        });
        for (const [source, translation] of Object.entries(translations)) {
          localeFile[source] = translation;
          didTranslate = true;
        }
        localeJson[fileId] = localeFile;
        writeJson(localePath, sortFiles(localeJson));
      }
    } finally {
      inflight.delete(fileId);
    }

    return didTranslate;
  }

  return { onSourceFileChange };
}

interface TranslateMissingOptions {
  contextBySource: Map<string, MessageContext>;
  fileId: string;
  locale: string;
  missing: string[];
  options: AutoTranslateOptions;
}

function toTranslationContext(
  context: MessageContext | undefined,
  fileId: string,
): TranslationContext | undefined {
  if (!context) {
    return undefined;
  }
  return {
    componentName: context.componentName,
    fileId,
    snippet: context.snippet,
  };
}

async function translateMissing(
  args: TranslateMissingOptions,
): Promise<Record<string, string>> {
  const { contextBySource, fileId, locale, missing, options } = args;
  const result: Record<string, string> = {};

  if (missing.length > 1 && options.provider.translateBatch) {
    try {
      const contexts = missing.map((source) =>
        toTranslationContext(contextBySource.get(source), fileId),
      );
      const hasContext = contexts.some((c) => c !== undefined);
      const batch = await options.provider.translateBatch({
        contexts: hasContext
          ? contexts.map((c) => c ?? { componentName: '', fileId, snippet: '' })
          : undefined,
        defaultLocale: options.defaultLocale,
        glossary: options.glossary,
        sources: missing,
        targetLocale: locale,
        voice: options.voice,
      });
      for (let i = 0; i < missing.length; i++) {
        const source = missing[i];
        const translation = batch[i];
        if (source && translation !== undefined) {
          result[source] = translation;
        }
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(
        `[yapyak] batch failed (${message}), falling back to one-by-one\n`,
      );
    }
  }

  for (const source of missing) {
    try {
      const translation = await options.provider.translate({
        context: toTranslationContext(contextBySource.get(source), fileId),
        defaultLocale: options.defaultLocale,
        fileId,
        glossary: options.glossary,
        source,
        targetLocale: locale,
        voice: options.voice,
      });
      result[source] = translation;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`[yapyak] translate failed: ${message}\n`);
    }
  }

  return result;
}

interface ApplyRenamesArgs {
  defaultLocale: string;
  fileId: string;
  locales: string[];
  localesDir: string;
  projectRoot: string;
  renames: Array<{ from: string; to: string }>;
}

function applyRenames(args: ApplyRenamesArgs): void {
  const { defaultLocale, fileId, locales, localesDir, projectRoot, renames } =
    args;
  for (const locale of locales) {
    const path = join(projectRoot, localesDir, `${locale}.json`);
    const json = readJson(path);
    const fileEntries = json[fileId];
    if (!fileEntries) {
      continue;
    }
    let changed = false;
    for (const rename of renames) {
      const previous = fileEntries[rename.from];
      if (previous === undefined) {
        continue;
      }
      if (locale === defaultLocale) {
        fileEntries[rename.to] = rename.to;
      } else {
        fileEntries[rename.to] = previous;
      }
      delete fileEntries[rename.from];
      changed = true;
    }
    if (changed) {
      json[fileId] = fileEntries;
      writeJson(path, sortFiles(json));
    }
  }
}

function sourceLocalePath(options: AutoTranslateOptions): string {
  return join(
    options.projectRoot,
    options.localesDir,
    `${options.defaultLocale}.json`,
  );
}

function otherLocalePath(
  options: AutoTranslateOptions,
  locale: string,
): string {
  return join(options.projectRoot, options.localesDir, `${locale}.json`);
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

function sortFiles(
  json: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const sortedFiles = Object.keys(json).sort();
  const result: Record<string, Record<string, string>> = {};
  for (const fileId of sortedFiles) {
    const fileTranslations = json[fileId] ?? {};
    const sortedKeys = Object.keys(fileTranslations).sort();
    const sortedFile: Record<string, string> = {};
    for (const key of sortedKeys) {
      sortedFile[key] = fileTranslations[key] ?? '';
    }
    result[fileId] = sortedFile;
  }
  return result;
}
