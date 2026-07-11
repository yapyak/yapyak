import type { TranslateRequest, Translator } from '../../translator';
import type { ExtractedMessage } from '../parser';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
});
