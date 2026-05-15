import type { LocaleData } from './transform-source.ts';

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ReadOptions {
  locales: string[];
  localesDir: string;
  projectRoot: string;
}

export function readLocaleData(options: ReadOptions): LocaleData {
  const data: LocaleData = {};
  for (const locale of options.locales) {
    data[locale] = readLocaleFile(
      join(options.projectRoot, options.localesDir, `${locale}.json`),
    );
  }
  return data;
}

function readLocaleFile(path: string): {
  [fileId: string]: { [key: string]: string };
} {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (content.trim() === '') {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  const result: { [fileId: string]: { [key: string]: string } } = {};
  for (const [fileId, fileEntries] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (typeof fileEntries !== 'object' || fileEntries === null) {
      continue;
    }
    const flat: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(
      fileEntries as Record<string, unknown>,
    )) {
      if (typeof value === 'string') {
        flat[key] = value;
      }
    }
    result[fileId] = flat;
  }
  return result;
}
