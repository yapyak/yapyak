import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { Translator } from '../translators/types.js';

export interface AutoTranslateOptions {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  projectRoot: string;
  translator: Translator;
}

export interface AutoTranslateResult {
  errors: Array<{ error: unknown; fileId: string; key: string; locale: string }>;
  translated: number;
}

interface Stub {
  fileId: string;
  key: string;
  locale: string;
  source: string;
}

export async function autoTranslate(
  options: AutoTranslateOptions,
): Promise<AutoTranslateResult> {
  const defaultPath = join(
    options.projectRoot,
    options.localesDir,
    `${options.defaultLocale}.yml`,
  );
  const sources = readLocaleFile(defaultPath);
  const stubs = collectStubs(options, sources);
  if (stubs.length === 0) {
    return { errors: [], translated: 0 };
  }

  const byLocale = groupByLocale(stubs);
  const errors: AutoTranslateResult['errors'] = [];
  let translated = 0;

  for (const [locale, localeStubs] of Object.entries(byLocale)) {
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.yml`,
    );
    const data = readLocaleFile(localePath);
    let touched = false;

    for (const stub of localeStubs) {
      try {
        const result = await options.translator({
          fileId: stub.fileId,
          key: stub.key,
          source: stub.source,
          sourceLocale: options.defaultLocale,
          targetLocale: stub.locale,
        });
        const trimmed = result.trim();
        if (trimmed === '') {
          continue;
        }
        setNested(data, stub.fileId, stub.key, trimmed);
        translated++;
        touched = true;
      } catch (error) {
        errors.push({
          error,
          fileId: stub.fileId,
          key: stub.key,
          locale: stub.locale,
        });
      }
    }

    if (touched) {
      writeLocaleFile(localePath, data);
    }
  }

  return { errors, translated };
}

function collectStubs(
  options: AutoTranslateOptions,
  sources: Record<string, unknown>,
): Stub[] {
  const stubs: Stub[] = [];
  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.yml`,
    );
    const localeData = readLocaleFile(localePath);
    for (const [fileId, fileSources] of Object.entries(sources)) {
      if (typeof fileSources !== 'object' || fileSources === null) {
        continue;
      }
      const localeFile = localeData[fileId];
      walkLocaleEntries(
        fileSources as Record<string, unknown>,
        typeof localeFile === 'object' && localeFile !== null
          ? (localeFile as Record<string, unknown>)
          : {},
        '',
        (key, source) => {
          stubs.push({ fileId, key, locale, source });
        },
      );
    }
  }
  return stubs;
}

function walkLocaleEntries(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  prefix: string,
  emit: (key: string, source: string) => void,
): void {
  for (const [key, value] of Object.entries(source)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') {
      const targetValue = readNested(target, path);
      if (typeof targetValue !== 'string' || targetValue === '') {
        emit(path, value);
      }
    } else if (typeof value === 'object' && value !== null) {
      walkLocaleEntries(
        value as Record<string, unknown>,
        target,
        path,
        emit,
      );
    }
  }
}

function readNested(
  target: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path.split('.');
  let current: unknown = target;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNested(
  data: Record<string, unknown>,
  fileId: string,
  path: string,
  value: string,
): void {
  let entry = data[fileId];
  if (typeof entry !== 'object' || entry === null) {
    entry = {};
    data[fileId] = entry;
  }
  const parts = path.split('.');
  let current = entry as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === undefined) {
      continue;
    }
    let next = current[part];
    if (typeof next !== 'object' || next === null) {
      next = {};
      current[part] = next;
    }
    current = next as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (last !== undefined) {
    current[last] = value;
  }
}

function groupByLocale(stubs: Stub[]): Record<string, Stub[]> {
  const grouped: Record<string, Stub[]> = {};
  for (const stub of stubs) {
    const list = grouped[stub.locale];
    if (list === undefined) {
      grouped[stub.locale] = [stub];
    } else {
      list.push(stub);
    }
  }
  return grouped;
}

function readLocaleFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (content.trim() === '') {
    return {};
  }
  const parsed: unknown = parse(content);
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  return parsed as Record<string, unknown>;
}

function writeLocaleFile(
  path: string,
  data: Record<string, unknown>,
): void {
  writeFileSync(path, stringify(data, { lineWidth: 0 }));
}
