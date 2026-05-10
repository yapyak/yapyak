import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { ExtractedMessage } from './extract-messages.js';

export type LocaleFile = Record<string, Record<string, string>>;

export interface SyncOptions {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  messages: ExtractedMessage[];
  projectRoot: string;
}

export function syncLocaleFiles(options: SyncOptions): void {
  const sourcesByFile = groupSourcesByFile(options.messages);

  for (const locale of options.locales) {
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.yml`,
    );
    const isDefault = locale === options.defaultLocale;
    const existing = readLocaleFile(localePath);
    const next: LocaleFile = {};

    for (const fileId of Object.keys(sourcesByFile).sort()) {
      const sources = sourcesByFile[fileId];
      if (sources === undefined) {
        continue;
      }
      const existingFile = existing[fileId] ?? {};
      const fileEntries: Record<string, string> = {};
      for (const source of sources) {
        if (isDefault) {
          fileEntries[source] = source;
        } else {
          const value = existingFile[source];
          fileEntries[source] = typeof value === 'string' ? value : '';
        }
      }
      next[fileId] = fileEntries;
    }

    writeLocaleFile(localePath, next);
  }
}

function groupSourcesByFile(
  messages: ExtractedMessage[],
): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};
  for (const message of messages) {
    let set = grouped[message.fileId];
    if (set === undefined) {
      set = new Set<string>();
      grouped[message.fileId] = set;
    }
    set.add(message.source);
  }
  const result: Record<string, string[]> = {};
  for (const [fileId, set] of Object.entries(grouped)) {
    result[fileId] = [...set].sort();
  }
  return result;
}

export function readLocaleFile(path: string): LocaleFile {
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
  const result: LocaleFile = {};
  for (const [fileId, entries] of Object.entries(parsed)) {
    if (typeof entries !== 'object' || entries === null) {
      continue;
    }
    const fileEntries: Record<string, string> = {};
    for (const [source, value] of Object.entries(entries)) {
      if (typeof value === 'string') {
        fileEntries[source] = value;
      }
    }
    result[fileId] = fileEntries;
  }
  return result;
}

export function writeLocaleFile(path: string, data: LocaleFile): void {
  mkdirSync(dirname(path), { recursive: true });
  const content = stringify(data, { lineWidth: 0 });
  writeFileSync(path, content);
}
