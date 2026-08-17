import type { TranslateRequest, Translator } from '../../translator';
import type { ExtractedMessage } from '../parser';
import type { TranslationProgress } from './locale';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readTranslationProgress, writeTranslationProgress } from './locale';
import { autoTranslate } from './translate';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('autoTranslate', () => {
  let projectRoot: string;
  let localePath: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-auto-translate-'));
    mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    localePath = join(projectRoot, 'locales', 'sv.json');
  });

  afterEach(() => {
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  it('writes a fresh locale file when the target does not yet exist', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          Promise.resolve([
            'Hej',
          ]),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 10,
                line: 1,
                offset: 10,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    expect(existsSync(localePath)).toBe(false);

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(1);
    expect(existsSync(localePath)).toBe(true);
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('loads examples from the locale data when `examples` is positive', async () => {
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Save: 'Spara',
        },
      }),
    );

    let receivedExamples:
      | {
          source: string;
          translation: string;
        }[]
      | undefined;
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: {
            examples?: {
              source: string;
              translation: string;
            }[];
          }[],
        ): Promise<string[]> => {
          receivedExamples = requests[0]?.examples;
          return Promise.resolve([
            'Hej',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 2,
                offset: 5,
              },
              start: {
                column: 1,
                line: 2,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
      {
        examples: 5,
      },
    );

    expect(result.translated).toBe(1);
    expect(receivedExamples).toEqual([
      {
        source: 'Save',
        translation: 'Spara',
      },
    ]);
  });

  it('captures the call-site context for each `t.as` variant', async () => {
    let receivedRequests: TranslateRequest[] | undefined;
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (requests: TranslateRequest[]): Promise<string[]> => {
          receivedRequests = requests;
          return Promise.resolve([
            'Öppna',
            'Öppen',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        context: 'button',
        id: 'm1',
        locations: [
          {
            callSiteContext: {
              enclosingElement: 'button',
              snippet: "t.as('button', 'Open')",
            },
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 10,
                line: 1,
                offset: 10,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Open',
      },
      {
        context: 'badge',
        id: 'm2',
        locations: [
          {
            callSiteContext: {
              enclosingElement: 'span',
              snippet: "t.as('badge', 'Open')",
            },
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 10,
                line: 2,
                offset: 20,
              },
              start: {
                column: 1,
                line: 2,
                offset: 11,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Open',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    const buttonRequest = receivedRequests?.find(
      (request) => request.disambiguation === 'button',
    );
    const badgeRequest = receivedRequests?.find(
      (request) => request.disambiguation === 'badge',
    );
    expect(buttonRequest?.context).toEqual({
      enclosingComponent: '',
      enclosingElement: 'button',
      snippet: "t.as('button', 'Open')",
    });
    expect(badgeRequest?.context).toEqual({
      enclosingComponent: '',
      enclosingElement: 'span',
      snippet: "t.as('badge', 'Open')",
    });
  });

  it('returns `translated: 0` with no errors when no target locales remain', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('should not be called')),
      {
        batch: () => Promise.reject(new Error('should not be called')),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result).toEqual({
      errors: [],
      translated: 0,
    });
    expect(existsSync(localePath)).toBe(false);
  });

  it('records a parity error and skips persistence when the translation drops a placeholder', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          Promise.resolve([
            'Hej',
          ]),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 10,
                line: 1,
                offset: 10,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hi {name}',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      fileId: 'src/a.tsx',
      locale: 'sv',
      source: 'Hi {name}',
    });
    const error = result.errors[0]?.error;
    expect(error instanceof Error ? error.message : String(error)).toMatch(
      /Translation placeholder mismatch.+missing \{name\}/,
    );
    expect(existsSync(localePath)).toBe(false);
  });

  it('records an unknown-branch error and skips persistence when the translation uses a branch the locale lacks', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          Promise.resolve([
            '{count, plural, one {# objekt} few {# objekt} other {# objekt}}',
          ]),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 10,
                line: 1,
                offset: 10,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'You have {count, plural, one {# item} other {# items}}',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(0);
    const error = result.errors[0]?.error;
    expect(error instanceof Error ? error.message : String(error)).toMatch(
      /unknown branch "few" in \{count\} \(the locale has one, other\)/,
    );
    expect(existsSync(localePath)).toBe(false);
  });

  it('records a chunk error per request when the translator invokes `onChunkError`', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkError?: (
              error: unknown,
              requests: TranslateRequest[],
            ) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkError?.(new Error('chunk failed'), requests);
          return Promise.resolve(requests.map(() => ''));
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      fileId: 'src/a.tsx',
      locale: 'sv',
      source: 'Hello',
    });
    const error = result.errors[0]?.error;
    expect(error instanceof Error ? error.message : String(error)).toBe(
      'chunk failed',
    );
  });

  it('falls back to single-call translation when the translator lacks `batch`', async () => {
    const seen: string[] = [];
    const translator: Translator = Object.assign(
      (request: TranslateRequest) => {
        seen.push(request.source);
        return Promise.resolve('Hej');
      },
      {
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(1);
    expect(seen).toEqual([
      'Hello',
    ]);
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('preserves a concurrent edit when flushing a later chunk', async () => {
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkComplete?.(requests.slice(0, 1), [
            {
              sv: 'Spara',
            },
          ]);
          writeFileSync(
            localePath,
            JSON.stringify({
              'src/a.tsx': {
                Hello: 'Hallo',
                Save: 'Spara',
              },
            }),
          );
          options?.onChunkComplete?.(requests.slice(1, 2), [
            {
              sv: 'Avbryt',
            },
          ]);
          return Promise.resolve([
            'Spara',
            'Avbryt',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
      {
        id: 'm2',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 2,
                offset: 15,
              },
              start: {
                column: 1,
                line: 2,
                offset: 11,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Save',
      },
      {
        id: 'm3',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 7,
                line: 3,
                offset: 22,
              },
              start: {
                column: 1,
                line: 3,
                offset: 16,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Cancel',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(2);
    expect(result.errors).toEqual([]);
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Cancel: 'Avbryt',
        Hello: 'Hallo',
        Save: 'Spara',
      },
    });
  });

  it('preserves a concurrently added translation when flushing a later chunk', async () => {
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkComplete?.(requests.slice(0, 1), [
            {
              sv: 'Spara',
            },
          ]);
          writeFileSync(
            localePath,
            JSON.stringify({
              'src/a.tsx': {
                Hello: 'Hej',
                Save: 'Spara',
                Settings: 'Inställningar',
              },
            }),
          );
          options?.onChunkComplete?.(requests.slice(1, 2), [
            {
              sv: 'Avbryt',
            },
          ]);
          return Promise.resolve([
            'Spara',
            'Avbryt',
            '',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Save',
      },
      {
        id: 'm2',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 7,
                line: 2,
                offset: 13,
              },
              start: {
                column: 1,
                line: 2,
                offset: 7,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Cancel',
      },
      {
        id: 'm3',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 9,
                line: 3,
                offset: 23,
              },
              start: {
                column: 1,
                line: 3,
                offset: 14,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Settings',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(2);
    expect(result.errors).toEqual([]);
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Cancel: 'Avbryt',
        Hello: 'Hej',
        Save: 'Spara',
        Settings: 'Inställningar',
      },
    });
  });

  it('blocks persistence when the signal aborts before the translator returns', async () => {
    const controller = new AbortController();
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () => {
          controller.abort();
          return Promise.resolve([
            'Hej',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
      {
        signal: controller.signal,
      },
    );

    expect(result.translated).toBe(0);
    expect(existsSync(localePath)).toBe(false);
  });

  it('blocks persistence in `onChunkComplete` after the signal aborts mid-batch', async () => {
    const controller = new AbortController();
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          controller.abort();
          options?.onChunkComplete?.(requests, [
            {
              sv: 'Hej',
            },
          ]);
          return Promise.resolve([
            'Hej',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
      {
        signal: controller.signal,
      },
    );

    expect(result.translated).toBe(0);
    expect(existsSync(localePath)).toBe(false);
  });

  it('reports no errors when the batch throws after the signal aborts', async () => {
    const controller = new AbortController();
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkComplete?.(requests.slice(0, 1), [
            {
              sv: 'Hej',
            },
          ]);
          controller.abort();
          return Promise.reject(new Error('Translate batch aborted.'));
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
      {
        id: 'm2',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 2,
                offset: 5,
              },
              start: {
                column: 1,
                line: 2,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'World',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
      {
        signal: controller.signal,
      },
    );

    expect(result.translated).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('reports errors for every unpersisted stub when the batch throws', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkComplete?.(requests.slice(0, 1), [
            {
              sv: 'Hej',
            },
          ]);
          return Promise.reject(new Error('batch failed'));
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
      {
        id: 'm2',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 2,
                offset: 5,
              },
              start: {
                column: 1,
                line: 2,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'World',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.source).toBe('World');
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('reports an error for every stub when the locale file turns corrupt mid-batch', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          writeFileSync(localePath, '{');
          options?.onChunkComplete?.(requests.slice(0, 1), [
            {
              sv: 'Hej',
            },
          ]);
          return Promise.reject(new Error('batch failed'));
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
      {
        id: 'm2',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 2,
                offset: 5,
              },
              start: {
                column: 1,
                line: 2,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'World',
      },
    ];

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]?.source).toBe('Hello');
    expect(result.errors[0]?.error).toBeInstanceOf(Error);
    expect(result.errors[1]?.source).toBe('World');
    expect(readFileSync(localePath, 'utf-8')).toBe('{');
  });

  it('writes a finished progress record to `.yapyak/progress.json`', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          Promise.resolve([
            'Hej',
          ]),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(readTranslationProgress(join(projectRoot, '.yapyak'))).toEqual({
      errors: [],
      finishedAt: expect.any(String),
      id: expect.any(String),
      locales: [
        'sv',
      ],
      pid: process.pid,
      startedAt: expect.any(String),
      total: 1,
      translated: 1,
    });
  });

  it('writes the progress into `yapyakDir` when given', async () => {
    const yapyakDir = join(projectRoot, 'cache');
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          Promise.resolve([
            'Hej',
          ]),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
      {
        yapyakDir,
      },
    );

    expect(readTranslationProgress(yapyakDir)?.translated).toBe(1);
    expect(existsSync(join(projectRoot, '.yapyak', 'progress.json'))).toBe(
      false,
    );
  });

  it('writes an unfinished progress record before the translator runs', async () => {
    let progress: TranslationProgress | undefined;
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () => {
          progress = readTranslationProgress(join(projectRoot, '.yapyak'));
          return Promise.resolve([
            'Hej',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(progress).toEqual({
      errors: [],
      finishedAt: null,
      id: expect.any(String),
      locales: [
        'sv',
      ],
      pid: process.pid,
      startedAt: expect.any(String),
      total: 1,
      translated: 0,
    });
  });

  it('writes the translated count after each chunk', async () => {
    let progress: TranslationProgress | undefined;
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkComplete?.(requests, [
            {
              sv: 'Hej',
            },
          ]);
          progress = readTranslationProgress(join(projectRoot, '.yapyak'));
          return Promise.resolve([
            'Hej',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(progress?.finishedAt).toBeNull();
    expect(progress?.translated).toBe(1);
  });

  it('records every failed translation in the progress file', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkError?: (error: unknown, chunk: TranslateRequest[]) => void;
          },
        ): Promise<string[]> => {
          options?.onChunkError?.(new Error('chunk failed'), requests);
          return Promise.resolve([
            '',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(
      readTranslationProgress(join(projectRoot, '.yapyak'))?.errors,
    ).toEqual([
      {
        fileId: 'src/a.tsx',
        locale: 'sv',
        message: 'chunk failed',
        source: 'Hello',
      },
    ]);
  });

  it('writes a finished progress record when the signal aborts', async () => {
    const controller = new AbortController();
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () => {
          controller.abort();
          return Promise.reject(new Error('Translate batch aborted.'));
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
      {
        signal: controller.signal,
      },
    );

    const progress = readTranslationProgress(join(projectRoot, '.yapyak'));
    expect(progress?.finishedAt).toEqual(expect.any(String));
    expect(progress?.translated).toBe(0);
  });

  it('preserves the progress of a newer run when the run finishes', async () => {
    const yapyakDir = join(projectRoot, '.yapyak');
    const newer: TranslationProgress = {
      errors: [],
      finishedAt: null,
      id: 'run-2',
      locales: [
        'sv',
      ],
      pid: process.pid,
      startedAt: '2025-01-01T00:00:00.000Z',
      total: 2,
      translated: 0,
    };
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: (
          requests: TranslateRequest[],
          options?: {
            onChunkComplete?: (
              chunk: TranslateRequest[],
              result: {
                sv: string;
              }[],
            ) => void;
          },
        ): Promise<string[]> => {
          writeTranslationProgress(yapyakDir, newer);
          options?.onChunkComplete?.(requests, [
            {
              sv: 'Hej',
            },
          ]);
          return Promise.resolve([
            'Hej',
          ]);
        },
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(readTranslationProgress(yapyakDir)).toEqual(newer);
  });

  it('writes no progress file when no stub remains', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('should not be called')),
      {
        batch: () => Promise.reject(new Error('should not be called')),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(existsSync(join(projectRoot, '.yapyak', 'progress.json'))).toBe(
      false,
    );
  });
});
