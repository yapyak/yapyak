import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import type { TranslateFunction } from '../ai/index.js';
import { extractMessages } from '../compiler/index.js';
import { findBareBindings } from './find-bare-bindings.js';

export interface AutoTranslateOptions {
  defaultLocale: string;
  factories: string[];
  glossary: Record<string, Record<string, string>>;
  intlModules: string[];
  locales: string[];
  localesDir: string;
  projectRoot: string;
  translate: TranslateFunction;
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
    if (!/\.(?:tsx?|jsx?|mjs|cjs)$/.test(absolutePath)) {
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

    const sources = new Set<string>();
    for (const message of extracted) {
      sources.add(message.source);
    }

    if (sources.size === 0) {
      return false;
    }

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
        for (const source of missing) {
          try {
            const translation = await options.translate({
              defaultLocale: options.defaultLocale,
              fileId,
              glossary: options.glossary,
              source,
              targetLocale: locale,
              voice: options.voice,
            });
            localeFile[source] = translation;
            didTranslate = true;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            process.stderr.write(`[yapyak] translate failed: ${message}\n`);
          }
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
