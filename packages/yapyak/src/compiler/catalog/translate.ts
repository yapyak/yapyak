import type {
  MessageContext,
  TranslateRequest,
  TranslationExample,
  Translator,
} from '../../translator';
import type { ExtractedMessage, Location } from '../parser/file/extract';
import type { LocaleData, LocaleFile, OrphanCache } from './locale';

import { extractExamples } from './example';
import {
  getDefaultYapyakDir,
  readLocaleFile,
  readOrphans,
  validateLocaleCode,
  writeLocaleFile,
} from './locale';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface AutoTranslateOptions {
  defaultLocale: string;
  examples?: number;
  force?: boolean;
  locales: string[];
  localesDir: string;
  messages: ExtractedMessage[];
  projectRoot: string;
  translator: Translator;
  yapyakDir?: string;
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

interface TranslationStub {
  context: MessageContext | undefined;
  disambiguation: string | undefined;
  fileId: string;
  locale: string;
  source: string;
}

function getStubKey(stub: TranslationStub): string {
  return stub.disambiguation === undefined
    ? stub.source
    : `${stub.source}@${stub.disambiguation}`;
}

export async function autoTranslate(
  options: AutoTranslateOptions,
): Promise<AutoTranslateResult> {
  const contextBySource = extractContexts(options.messages);
  const stubs = extractStubs(options, contextBySource);
  if (stubs.length === 0) {
    return { errors: [], translated: 0 };
  }

  const extractedSources = toExtractedSources(options.messages);
  const errors: AutoTranslateResult['errors'] = [];
  let translated = 0;

  const examplesMax = options.examples ?? 0;
  const exampleCache = loadExampleCache(options, examplesMax);

  const requests = stubs.map((stub) =>
    buildRequest(stub, options, exampleCache, examplesMax),
  );

  let results: string[];
  try {
    results =
      typeof options.translator.batch === 'function'
        ? await options.translator.batch(requests)
        : await runOneByOne(stubs, requests, options.translator, errors);
  } catch (error) {
    for (const stub of stubs) {
      errors.push({
        error,
        fileId: stub.fileId,
        locale: stub.locale,
        source: stub.source,
      });
    }
    return { errors, translated };
  }

  const localeFiles = new Map<string, LocaleFile>();
  const touchedLocales = new Set<string>();
  for (let index = 0; index < stubs.length; index++) {
    const stub = stubs[index];
    const value = results[index];
    if (!stub || value === undefined) {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    let data = localeFiles.get(stub.locale);
    if (!data) {
      const localePath = join(
        options.projectRoot,
        options.localesDir,
        `${stub.locale}.json`,
      );
      data = readLocaleFile(localePath);
      localeFiles.set(stub.locale, data);
    }
    setEntry(data, stub.fileId, getStubKey(stub), trimmed);
    translated++;
    touchedLocales.add(stub.locale);
  }

  for (const locale of touchedLocales) {
    const localeFile = localeFiles.get(locale);
    if (!localeFile) {
      continue;
    }
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    if (!existsSync(localePath)) {
      continue;
    }
    writeLocaleFile({
      after: localeFile,
      extractedSources,
      filePath: localePath,
    });
  }

  return { errors, translated };
}

async function runOneByOne(
  stubs: TranslationStub[],
  requests: TranslateRequest[],
  translator: Translator,
  errors: AutoTranslateResult['errors'],
): Promise<string[]> {
  const results: string[] = [];
  for (let index = 0; index < stubs.length; index++) {
    const stub = stubs[index];
    const request = requests[index];
    if (!stub || !request) {
      results.push('');
      continue;
    }
    try {
      results.push(await translator(request));
    } catch (error) {
      results.push('');
      errors.push({
        error,
        fileId: stub.fileId,
        locale: stub.locale,
        source: stub.source,
      });
    }
  }
  return results;
}

function buildRequest(
  stub: TranslationStub,
  options: AutoTranslateOptions,
  exampleCache: ExampleCache,
  examplesMax: number,
): TranslateRequest {
  const request: TranslateRequest = {
    fileId: stub.fileId,
    source: stub.source,
    sourceLocale: options.defaultLocale,
    targetLocale: stub.locale,
  };
  if (stub.context !== undefined) {
    request.context = stub.context;
  }
  if (stub.disambiguation !== undefined) {
    request.disambiguation = stub.disambiguation;
  }
  const examples = extractExamplesForStub(exampleCache, stub, examplesMax);
  if (examples.length > 0) {
    request.examples = examples;
  }
  return request;
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

function extractContexts(
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

function extractStubs(
  options: AutoTranslateOptions,
  contexts: Map<string, MessageContext>,
): TranslationStub[] {
  const stubs: TranslationStub[] = [];
  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    if (!validateLocaleCode(locale).valid) {
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

function dedupeStubs(stubs: TranslationStub[]): TranslationStub[] {
  const seenKeys = new Set<string>();
  const deduped: TranslationStub[] = [];
  for (const stub of stubs) {
    const key = `${stub.locale} ${stub.fileId} ${getStubKey(stub)}`;
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    deduped.push(stub);
  }
  return deduped;
}

function setEntry(
  localeFile: LocaleFile,
  fileId: string,
  source: string,
  value: string,
): void {
  let entry = localeFile[fileId];
  if (!entry) {
    entry = {};
    localeFile[fileId] = entry;
  }
  entry[source] = value;
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
  const yapyakDir =
    options.yapyakDir ?? getDefaultYapyakDir(options.projectRoot);
  const orphans = readOrphans(yapyakDir);
  return { localeData, orphans };
}

function extractExamplesForStub(
  cache: ExampleCache,
  stub: TranslationStub,
  max: number,
): TranslationExample[] {
  if (max <= 0) {
    return [];
  }
  return extractExamples({
    currentFileId: stub.fileId,
    excludeKey: getStubKey(stub),
    locale: stub.locale,
    localeData: cache.localeData,
    max,
    orphans: cache.orphans,
    source: stub.source,
  });
}
