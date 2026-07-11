import type {
  LocaleTranslations,
  MessageContext,
  TranslateRequest,
  TranslationExample,
  Translator,
} from '../../translator';
import type { ExtractedMessage, Location } from '../parser';
import type {
  CatalogEntry,
  LocaleContext,
  LocaleData,
  LocaleFile,
  OrphanCache,
} from './locale';

import { toMessageKey } from '../parser';
import { extractExamples } from './example';
import {
  findTranslation,
  getDefaultYapyakDir,
  readLocaleFile,
  readOrphans,
  validateLocaleCode,
  validateTranslationParity,
  writeLocaleFile,
} from './locale';
import { join } from 'node:path';

export type AutoTranslateInput = {
  messages: ExtractedMessage[];
  translator: Translator;
};

export type AutoTranslateOptions = {
  examples?: number;
  force?: boolean;
  signal?: AbortSignal;
  yapyakDir?: string;
};

export type AutoTranslateResult = {
  errors: {
    error: unknown;
    fileId: string;
    locale: string;
    source: string;
  }[];
  translated: number;
};

type TranslationStub = {
  context: MessageContext;
  disambiguation: string | undefined;
  fileId: string;
  locale: string;
  source: string;
};

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
  const stubs = extractStubs(
    {
      force,
      messages: input.messages,
    },
    context,
    projectRoot,
  );
  if (stubs.length === 0) {
    return {
      errors: [],
      translated: 0,
    };
  }

  const extractedKeys = toExtractedKeys(input.messages);
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

  const signal = options?.signal;
  const stubByRequest = new Map<TranslateRequest, TranslationStub>();
  for (let index = 0; index < requests.length; index++) {
    const request = requests[index];
    const stub = stubs[index];
    if (request && stub) {
      stubByRequest.set(request, stub);
    }
  }
  const onChunkError = (
    error: unknown,
    chunkRequests: TranslateRequest[],
  ): void => {
    for (const request of chunkRequests) {
      const stub = stubByRequest.get(request);
      if (!stub) {
        continue;
      }
      errors.push({
        error,
        fileId: stub.fileId,
        locale: stub.locale,
        source: stub.source,
      });
    }
  };
  const localeFiles = new Map<string, LocaleFile>();
  const touchedLocales = new Set<string>();
  const persistedStubs = new Set<TranslationStub>();
  const persistResult = (stub: TranslationStub, value: string): void => {
    if (signal?.aborted) {
      return;
    }
    if (persistedStubs.has(stub)) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const parity = validateTranslationParity(stub.source, trimmed);
    if (!parity.ok) {
      errors.push({
        error: new Error(
          `Translation placeholder mismatch: ${parity.issues
            .map((issue) => {
              switch (issue.kind) {
                case 'missing':
                  return `missing {${issue.name}}`;
                case 'extra':
                  return `extra {${issue.name}}`;
                case 'kind-mismatch':
                  return `kind mismatch for {${issue.name}} (${issue.sourceKind} vs ${issue.targetKind})`;
                case 'missing-other-branch':
                  return `missing \`other\` branch in {${issue.name}}`;
                case 'missing-select-branch':
                  return `missing select branch "${issue.branch}" in {${issue.name}}`;
                default: {
                  const exhaustive: never = issue.kind;
                  throw new Error(
                    `unreachable parity issue kind: ${String(exhaustive)}`,
                  );
                }
              }
            })
            .join(', ')}`,
        ),
        fileId: stub.fileId,
        locale: stub.locale,
        source: stub.source,
      });
      return;
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
    const fileEntries: Record<string, CatalogEntry> =
      localeFile[stub.fileId] ?? Object.create(null);
    localeFile[stub.fileId] = fileEntries;
    setEntry(fileEntries, stub.source, stub.disambiguation, trimmed);
    translated++;
    touchedLocales.add(stub.locale);
    persistedStubs.add(stub);
  };
  const flushTouchedLocales = (): void => {
    for (const locale of touchedLocales) {
      const localeFile = localeFiles.get(locale);
      if (!localeFile) {
        continue;
      }
      const localePath = join(
        projectRoot,
        context.localesDir,
        `${locale}.json`,
      );
      writeLocaleFile({
        after: localeFile,
        extractedKeys,
        filePath: localePath,
      });
    }
    touchedLocales.clear();
  };
  const onChunkComplete = (
    chunkRequests: TranslateRequest[],
    chunkResult: LocaleTranslations[],
  ): void => {
    for (let chunkIndex = 0; chunkIndex < chunkRequests.length; chunkIndex++) {
      const chunkRequest = chunkRequests[chunkIndex];
      if (!chunkRequest) {
        continue;
      }
      const stub = stubByRequest.get(chunkRequest);
      if (!stub) {
        continue;
      }
      const translations = chunkResult[chunkIndex];
      if (!translations) {
        continue;
      }
      const value = translations[chunkRequest.targetLocale];
      if (typeof value !== 'string') {
        continue;
      }
      persistResult(stub, value);
    }
    flushTouchedLocales();
  };
  let results: string[];
  try {
    results =
      typeof input.translator.batch === 'function'
        ? await input.translator.batch(requests, {
            onChunkComplete,
            onChunkError,
            ...(signal === undefined
              ? {}
              : {
                  signal,
                }),
          })
        : await runOneByOne(stubs, requests, input.translator, errors, signal);
  } catch (error) {
    flushTouchedLocales();
    for (const stub of stubs) {
      errors.push({
        error,
        fileId: stub.fileId,
        locale: stub.locale,
        source: stub.source,
      });
    }
    return {
      errors,
      translated,
    };
  }
  for (let index = 0; index < stubs.length; index++) {
    const stub = stubs[index];
    const value = results[index];
    if (!stub || value === undefined) {
      continue;
    }
    if (persistedStubs.has(stub)) {
      continue;
    }
    persistResult(stub, value);
  }
  flushTouchedLocales();

  return {
    errors,
    translated,
  };
}

async function runOneByOne(
  stubs: TranslationStub[],
  requests: TranslateRequest[],
  translator: Translator,
  errors: AutoTranslateResult['errors'],
  signal: AbortSignal | undefined,
): Promise<string[]> {
  const results: string[] = [];
  for (let index = 0; index < stubs.length; index++) {
    if (signal?.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new Error('Translate batch aborted.');
    }
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
    context: stub.context,
    fileId: stub.fileId,
    source: stub.source,
    sourceLocale: defaultLocale,
    targetLocale: stub.locale,
  };
  if (stub.disambiguation !== undefined) {
    request.disambiguation = stub.disambiguation;
  }
  const examples = extractExamplesForStub(exampleCache, stub, examplesMax);
  if (examples.length > 0) {
    request.examples = examples;
  }
  return request;
}

function toExtractedKeys(
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

function toMessageContext(location: Location): MessageContext {
  return {
    enclosingComponent: location.callSiteContext.enclosingComponent ?? '',
    enclosingElement: location.callSiteContext.enclosingElement,
    snippet: location.callSiteContext.snippet ?? '',
  };
}

type ExtractStubsInput = {
  force: boolean;
  messages: ExtractedMessage[];
};

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
      for (const location of message.locations) {
        if (!input.force) {
          const existing = findTranslation(
            localeData[location.fileId]?.[message.source],
            message.context,
          );
          if (existing !== undefined && existing !== '') {
            continue;
          }
        }
        stubs.push({
          context: toMessageContext(location),
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
  fileEntries: Record<string, CatalogEntry>,
  source: string,
  context: string | undefined,
  value: string,
): void {
  if (context === undefined) {
    fileEntries[source] = value;
    return;
  }
  const existing = fileEntries[source];
  const variants: Record<string, string> =
    typeof existing === 'object' ? existing : Object.create(null);
  variants[context] = value;
  fileEntries[source] = variants;
}

type ExampleCache = {
  localeData: LocaleData;
  orphans: OrphanCache;
};

function loadExampleCache(
  context: LocaleContext,
  projectRoot: string,
  yapyakDir: string | undefined,
  max: number,
): ExampleCache {
  if (max <= 0) {
    return {
      localeData: {},
      orphans: {},
    };
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
  return {
    localeData,
    orphans,
  };
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
