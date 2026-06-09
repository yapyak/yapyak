import type {
  MessageContext,
  TranslateRequest,
  TranslationExample,
  Translator,
} from '../../translator';
import type { ExtractedMessage, Location } from '../parser';
import type {
  LocaleContext,
  LocaleData,
  LocaleFile,
  OrphanCache,
} from './locale';

import { toMessageKey } from '../parser';
import { extractExamples } from './example';
import {
  getDefaultYapyakDir,
  readLocaleFile,
  readOrphans,
  validateLocaleCode,
  writeLocaleFile,
} from './locale';
import { toLocationKey } from './location-key';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface AutoTranslateInput {
  messages: ExtractedMessage[];
  translator: Translator;
}

export interface AutoTranslateOptions {
  examples?: number;
  force?: boolean;
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
  return toMessageKey(stub.source, stub.disambiguation);
}

export async function autoTranslate(
  input: AutoTranslateInput,
  context: LocaleContext,
  projectRoot: string,
  options?: AutoTranslateOptions,
): Promise<AutoTranslateResult> {
  const force = options?.force ?? false;
  const examplesMax = options?.examples ?? 0;
  const contextBySource = extractContexts(input.messages);
  const stubs = extractStubs(
    {
      contexts: contextBySource,
      force,
      messages: input.messages,
    },
    context,
    projectRoot,
  );
  if (stubs.length === 0) {
    return { errors: [], translated: 0 };
  }

  const extractedSources = toExtractedSources(input.messages);
  const errors: AutoTranslateResult['errors'] = [];
  let translated = 0;

  const exampleCache = loadExampleCache(
    context,
    projectRoot,
    options?.yapyakDir,
    examplesMax,
  );

  const requests = stubs.map((stub) =>
    buildRequest(stub, context.defaultLocale, exampleCache, examplesMax),
  );

  let results: string[];
  try {
    results =
      typeof input.translator.batch === 'function'
        ? await input.translator.batch(requests)
        : await runOneByOne(stubs, requests, input.translator, errors);
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
    let localeFile = localeFiles.get(stub.locale);
    if (!localeFile) {
      const localePath = join(
        projectRoot,
        context.localesDir,
        `${stub.locale}.json`,
      );
      localeFile = readLocaleFile(localePath);
      localeFiles.set(stub.locale, localeFile);
    }
    setEntry(localeFile, stub.fileId, getStubKey(stub), trimmed);
    translated++;
    touchedLocales.add(stub.locale);
  }

  for (const locale of touchedLocales) {
    const localeFile = localeFiles.get(locale);
    if (!localeFile) {
      continue;
    }
    const localePath = join(projectRoot, context.localesDir, `${locale}.json`);
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
  defaultLocale: string,
  exampleCache: ExampleCache,
  examplesMax: number,
): TranslateRequest {
  const request: TranslateRequest = {
    fileId: stub.fileId,
    source: stub.source,
    sourceLocale: defaultLocale,
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
    const key = toMessageKey(message.source, message.context);
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
        toLocationKey(location.fileId, message.source),
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

interface ExtractStubsInput {
  contexts: Map<string, MessageContext>;
  force: boolean;
  messages: ExtractedMessage[];
}

function extractStubs(
  input: ExtractStubsInput,
  context: LocaleContext,
  projectRoot: string,
): TranslationStub[] {
  const stubs: TranslationStub[] = [];
  for (const locale of context.locales) {
    if (locale === context.defaultLocale) {
      continue;
    }
    if (!validateLocaleCode(locale).valid) {
      continue;
    }
    const localePath = join(projectRoot, context.localesDir, `${locale}.json`);
    const localeData = readLocaleFile(localePath);
    for (const message of input.messages) {
      const key = toMessageKey(message.source, message.context);
      for (const location of message.locations) {
        if (!input.force) {
          const localeFile = localeData[location.fileId];
          const existing = localeFile?.[key];
          if (typeof existing === 'string' && existing !== '') {
            continue;
          }
        }
        stubs.push({
          context: input.contexts.get(
            toLocationKey(location.fileId, message.source),
          ),
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
  context: LocaleContext,
  projectRoot: string,
  yapyakDir: string | undefined,
  max: number,
): ExampleCache {
  if (max <= 0) {
    return { localeData: {}, orphans: {} };
  }
  const localeData: LocaleData = {};
  for (const locale of context.locales) {
    if (locale === context.defaultLocale) {
      continue;
    }
    const path = join(projectRoot, context.localesDir, `${locale}.json`);
    localeData[locale] = readLocaleFile(path);
  }
  const resolvedYapyakDir = yapyakDir ?? getDefaultYapyakDir(projectRoot);
  const orphans = readOrphans(resolvedYapyakDir);
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
