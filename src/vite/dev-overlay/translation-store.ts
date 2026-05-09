import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface TranslationStoreOptions {
  localesDir: string;
  projectRoot: string;
}

export interface TranslationStore {
  delete: (locale: string, fileId: string, source: string) => boolean;
  read: (locale: string, fileId: string, source: string) => string | undefined;
  readAll: (
    locales: string[],
    fileId: string,
    source: string,
  ) => Record<string, string | null>;
  write: (
    locale: string,
    fileId: string,
    source: string,
    value: string,
  ) => void;
}

export function createTranslationStore(
  options: TranslationStoreOptions,
): TranslationStore {
  const { localesDir, projectRoot } = options;

  function path(locale: string): string {
    return join(projectRoot, localesDir, `${locale}.json`);
  }

  function load(locale: string): Record<string, Record<string, string>> {
    const filePath = path(locale);
    if (!existsSync(filePath)) {
      return {};
    }
    const raw = readFileSync(filePath, 'utf8');
    if (raw.trim() === '') {
      return {};
    }
    return JSON.parse(raw);
  }

  function save(
    locale: string,
    json: Record<string, Record<string, string>>,
  ): void {
    const sorted: Record<string, Record<string, string>> = {};
    for (const fileId of Object.keys(json).sort()) {
      const entries = json[fileId] ?? {};
      const sortedEntries: Record<string, string> = {};
      for (const source of Object.keys(entries).sort()) {
        const value = entries[source];
        if (value !== undefined) {
          sortedEntries[source] = value;
        }
      }
      sorted[fileId] = sortedEntries;
    }
    writeFileSync(path(locale), `${JSON.stringify(sorted, null, 2)}\n`);
  }

  return {
    delete(locale, fileId, source) {
      const json = load(locale);
      const entries = json[fileId];
      if (!entries || entries[source] === undefined) {
        return false;
      }
      delete entries[source];
      if (Object.keys(entries).length === 0) {
        delete json[fileId];
      } else {
        json[fileId] = entries;
      }
      save(locale, json);
      return true;
    },
    read(locale, fileId, source) {
      return load(locale)[fileId]?.[source];
    },
    readAll(locales, fileId, source) {
      const result: Record<string, string | null> = {};
      for (const locale of locales) {
        const value = load(locale)[fileId]?.[source];
        result[locale] = value ?? null;
      }
      return result;
    },
    write(locale, fileId, source, value) {
      const json = load(locale);
      const entries = json[fileId] ?? {};
      entries[source] = value;
      json[fileId] = entries;
      save(locale, json);
    },
  };
}
