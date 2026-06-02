import type {
  MessageContext,
  TranslationExample,
  Translator,
} from '@yapyak/translator';
import type { ExtractedMessage, Location } from '../parser/file/extract';
import type { LocaleData, LocaleFile, OrphanCache } from './locale';

import { collectExamples } from './example';
import {
  getDefaultCacheDir,
  readLocaleFile,
  readOrphans,
  writeLocaleFile,
} from './locale';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface AutoTranslateOptions {
  cacheDir?: string;
  defaultLocale: string;
  examples?: number;
  force?: boolean;
  locales: string[];
  localesDir: string;
  messages: ExtractedMessage[];
  projectRoot: string;
  translator: Translator;
}

export interface AutoTranslateResult {
  errors: Array<{
    error: unknown;
    fileId: string;
    locale: string;
    source: string;
  }>;
  translated: number;
}

interface Stub {
  context: MessageContext | undefined;
  disambiguation: string | undefined;
  fileId: string;
  locale: string;
  source: string;
}

function stubKey(stub: Stub): string {
  return stub.disambiguation === undefined
    ? stub.source
    : `${stub.source}@${stub.disambiguation}`;
}

export async function autoTranslate(
  options: AutoTranslateOptions,
): Promise<AutoTranslateResult> {
  const contextBySource = collectContexts(options.messages);
  const stubs = collectStubs(options, contextBySource);
  if (stubs.length === 0) {
    return { errors: [], translated: 0 };
  }

  const extractedSources = toExtractedSources(options.messages);
  const byLocale = groupByLocale(stubs);
  const errors: AutoTranslateResult['errors'] = [];
  let translated = 0;

  const examplesMax = options.examples ?? 0;
  const exampleCache = loadExampleCache(options, examplesMax);

  for (const [locale, localeStubs] of Object.entries(byLocale)) {
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    const data = readLocaleFile(localePath);
    let touched = false;
    const requests = localeStubs.map((stub) => {
      const request: {
        context: MessageContext | undefined;
        disambiguation?: string;
        examples?: TranslationExample[];
        fileId: string;
        source: string;
        sourceLocale: string;
        targetLocale: string;
      } = {
        context: stub.context,
        fileId: stub.fileId,
        source: stub.source,
        sourceLocale: options.defaultLocale,
        targetLocale: stub.locale,
      };
      if (stub.disambiguation !== undefined) {
        request.disambiguation = stub.disambiguation;
      }
      const examples = collectExamplesForStub(exampleCache, stub, examplesMax);
      if (examples.length > 0) {
        request.examples = examples;
      }
      return request;
    });

    if (typeof options.translator.batch === 'function') {
      try {
        const results = await options.translator.batch(requests);
        for (let i = 0; i < localeStubs.length; i++) {
          const stub = localeStubs[i];
          const value = results[i];
          if (stub === undefined || value === undefined) {
            continue;
          }
          const trimmed = value.trim();
          if (trimmed === '') {
            continue;
          }
          setEntry(data, stub.fileId, stubKey(stub), trimmed);
          translated++;
          touched = true;
        }
      } catch (error) {
        for (const stub of localeStubs) {
          errors.push({
            error,
            fileId: stub.fileId,
            locale: stub.locale,
            source: stub.source,
          });
        }
      }
    } else {
      for (let i = 0; i < localeStubs.length; i++) {
        const stub = localeStubs[i];
        const request = requests[i];
        if (!stub || !request) {
          continue;
        }
        try {
          const result = await options.translator(request);
          const trimmed = result.trim();
          if (trimmed === '') {
            continue;
          }
          setEntry(data, stub.fileId, stubKey(stub), trimmed);
          translated++;
          touched = true;
        } catch (error) {
          errors.push({
            error,
            fileId: stub.fileId,
            locale: stub.locale,
            source: stub.source,
          });
        }
      }
    }

    if (touched) {
      if (!existsSync(localePath)) {
        continue;
      }
      writeLocaleFile({
        after: data,
        extractedSources,
        filePath: localePath,
      });
    }
  }

  return { errors, translated };
}

function toExtractedSources(
  messages: ExtractedMessage[],
): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  for (const message of messages) {
    const key =
      message.context === undefined
        ? message.source
        : `${message.source}@${message.context}`;
    for (const location of message.locations) {
      let set = result[location.fileId];
      if (!set) {
        set = new Set<string>();
        result[location.fileId] = set;
      }
      set.add(key);
    }
  }
  return result;
}

function collectContexts(
  messages: ExtractedMessage[],
): Map<string, MessageContext> {
  const contexts = new Map<string, MessageContext>();
  for (const message of messages) {
    for (const location of message.locations) {
      contexts.set(
        `${location.fileId} ${message.source}`,
        toLegacyContext(location),
      );
    }
  }
  return contexts;
}

function toLegacyContext(location: Location): MessageContext {
  return {
    componentName: location.callSiteContext.componentName ?? '',
    enclosingElement: location.callSiteContext.enclosingJsx,
    snippet: '',
  };
}

function collectStubs(
  options: AutoTranslateOptions,
  contexts: Map<string, MessageContext>,
): Stub[] {
  const stubs: Stub[] = [];
  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    const localeData = readLocaleFile(localePath);
    for (const message of options.messages) {
      const key =
        message.context === undefined
          ? message.source
          : `${message.source}@${message.context}`;
      for (const location of message.locations) {
        if (options.force !== true) {
          const localeFile = localeData[location.fileId];
          const existing = localeFile?.[key];
          if (typeof existing === 'string' && existing !== '') {
            continue;
          }
        }
        stubs.push({
          context: contexts.get(`${location.fileId} ${message.source}`),
          disambiguation: message.context,
          fileId: location.fileId,
          locale,
          source: message.source,
        });
      }
    }
  }
  return dedupeStubs(stubs);
}

function dedupeStubs(stubs: Stub[]): Stub[] {
  const seen = new Set<string>();
  const out: Stub[] = [];
  for (const stub of stubs) {
    const key = `${stub.locale} ${stub.fileId} ${stubKey(stub)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(stub);
  }
  return out;
}

function setEntry(
  data: LocaleFile,
  fileId: string,
  source: string,
  value: string,
): void {
  let entry = data[fileId];
  if (!entry) {
    entry = {};
    data[fileId] = entry;
  }
  entry[source] = value;
}

function groupByLocale(stubs: Stub[]): Record<string, Stub[]> {
  const grouped: Record<string, Stub[]> = {};
  for (const stub of stubs) {
    const list = grouped[stub.locale];
    if (!list) {
      grouped[stub.locale] = [stub];
    } else {
      list.push(stub);
    }
  }
  return grouped;
}

interface ExampleCache {
  localeData: LocaleData;
  orphans: OrphanCache;
}

function loadExampleCache(
  options: AutoTranslateOptions,
  max: number,
): ExampleCache {
  if (max <= 0) {
    return { localeData: {}, orphans: {} };
  }
  const localeData: LocaleData = {};
  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    const path = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    localeData[locale] = readLocaleFile(path);
  }
  const cacheDir = options.cacheDir ?? getDefaultCacheDir(options.projectRoot);
  const orphans = readOrphans(cacheDir);
  return { localeData, orphans };
}

function collectExamplesForStub(
  cache: ExampleCache,
  stub: Stub,
  max: number,
): TranslationExample[] {
  if (max <= 0) {
    return [];
  }
  return collectExamples({
    currentFileId: stub.fileId,
    excludeKey: stubKey(stub),
    locale: stub.locale,
    localeData: cache.localeData,
    max,
    orphans: cache.orphans,
    source: stub.source,
  });
}
