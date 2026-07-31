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
  OrphanCache,
  TranslationParityResult,
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

type BatchContext = {
  errors: AutoTranslateResult['errors'];
  extractedKeys: Record<string, Set<string>>;
  localesDir: string;
  pendingTranslationsByLocale: Map<
    string,
    {
      stub: TranslationStub;
      value: string;
    }[]
  >;
  projectRoot: string;
  registeredStubs: Set<TranslationStub>;
  signal?: AbortSignal;
  stubsByRequest: Map<TranslateRequest, TranslationStub>;
  translated: number;
};

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
  const batchContext: BatchContext = {
    errors: [],
    extractedKeys: toExtractedKeys(input.messages),
    localesDir: context.localesDir,
    pendingTranslationsByLocale: new Map(),
    projectRoot,
    registeredStubs: new Set(),
    ...(signal === undefined
      ? {}
      : {
          signal,
        }),
    stubsByRequest: toStubsByRequest(requests, stubs),
    translated: 0,
  };

  let results: string[];
  try {
    results =
      typeof input.translator.batch === 'function'
        ? await input.translator.batch(requests, {
            onChunkComplete: (chunkRequests, chunkResult) => {
              registerChunk(batchContext, chunkRequests, chunkResult);
            },
            onChunkError: (error, chunkRequests) => {
              collectChunkErrors(batchContext, error, chunkRequests);
            },
            ...(signal === undefined
              ? {}
              : {
                  signal,
                }),
          })
        : await runOneByOne(
            stubs,
            requests,
            input.translator,
            batchContext.errors,
            signal,
          );
  } catch (error) {
    writePendingTranslations(batchContext);
    if (!signal?.aborted) {
      collectBatchErrors(batchContext, error, stubs);
    }
    return {
      errors: batchContext.errors,
      translated: batchContext.translated,
    };
  }

  for (let index = 0; index < stubs.length; index++) {
    const stub = stubs[index];
    const value = results[index];
    if (!stub || value === undefined) {
      continue;
    }
    registerTranslation(batchContext, stub, value);
  }
  writePendingTranslations(batchContext);

  return {
    errors: batchContext.errors,
    translated: batchContext.translated,
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

function toMessageContext(location: Location): MessageContext {
  return {
    enclosingComponent: location.callSiteContext.enclosingComponent ?? '',
    enclosingElement: location.callSiteContext.enclosingElement,
    snippet: location.callSiteContext.snippet ?? '',
  };
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

function getStubKey(stub: TranslationStub): string {
  return toMessageKey(stub.source, stub.disambiguation);
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

function toStubsByRequest(
  requests: TranslateRequest[],
  stubs: TranslationStub[],
): Map<TranslateRequest, TranslationStub> {
  const stubsByRequest = new Map<TranslateRequest, TranslationStub>();
  for (let index = 0; index < requests.length; index++) {
    const request = requests[index];
    const stub = stubs[index];
    if (request && stub) {
      stubsByRequest.set(request, stub);
    }
  }
  return stubsByRequest;
}

function registerChunk(
  context: BatchContext,
  chunkRequests: TranslateRequest[],
  chunkResult: LocaleTranslations[],
): void {
  for (let chunkIndex = 0; chunkIndex < chunkRequests.length; chunkIndex++) {
    const chunkRequest = chunkRequests[chunkIndex];
    if (!chunkRequest) {
      continue;
    }
    const stub = context.stubsByRequest.get(chunkRequest);
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
    registerTranslation(context, stub, value);
  }
  writePendingTranslations(context);
}

function collectChunkErrors(
  context: BatchContext,
  error: unknown,
  chunkRequests: TranslateRequest[],
): void {
  for (const request of chunkRequests) {
    const stub = context.stubsByRequest.get(request);
    if (!stub) {
      continue;
    }
    context.errors.push({
      error,
      fileId: stub.fileId,
      locale: stub.locale,
      source: stub.source,
    });
  }
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

function writePendingTranslations(context: BatchContext): void {
  for (const [locale, pending] of context.pendingTranslationsByLocale) {
    const localePath = join(
      context.projectRoot,
      context.localesDir,
      `${locale}.json`,
    );
    const localeFile = readLocaleFile(localePath);
    for (const { stub, value } of pending) {
      const fileEntries: Record<string, CatalogEntry> =
        localeFile[stub.fileId] ?? Object.create(null);
      localeFile[stub.fileId] = fileEntries;
      setEntry(fileEntries, stub.source, stub.disambiguation, value);
    }
    writeLocaleFile({
      after: localeFile,
      extractedKeys: context.extractedKeys,
      filePath: localePath,
    });
  }
  context.pendingTranslationsByLocale.clear();
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

function collectBatchErrors(
  context: BatchContext,
  error: unknown,
  stubs: TranslationStub[],
): void {
  for (const stub of stubs) {
    if (context.registeredStubs.has(stub)) {
      continue;
    }
    context.errors.push({
      error,
      fileId: stub.fileId,
      locale: stub.locale,
      source: stub.source,
    });
  }
}

function registerTranslation(
  context: BatchContext,
  stub: TranslationStub,
  value: string,
): void {
  if (context.signal?.aborted) {
    return;
  }
  if (context.registeredStubs.has(stub)) {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  const parity = validateTranslationParity(stub.source, trimmed);
  if (!parity.ok) {
    context.errors.push({
      error: new Error(
        `Translation placeholder mismatch: ${formatParityIssues(parity.issues)}`,
      ),
      fileId: stub.fileId,
      locale: stub.locale,
      source: stub.source,
    });
    return;
  }
  let pending = context.pendingTranslationsByLocale.get(stub.locale);
  if (!pending) {
    pending = [];
    context.pendingTranslationsByLocale.set(stub.locale, pending);
  }
  pending.push({
    stub,
    value: trimmed,
  });
  context.translated++;
  context.registeredStubs.add(stub);
}

function formatParityIssues(issues: TranslationParityResult['issues']): string {
  return issues
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
    .join(', ');
}
