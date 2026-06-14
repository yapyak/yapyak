import type { TranslateBatchRequest, TranslateRequest } from './type';

import { describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
import { createTranslator } from './create';

describe('createTranslator', () => {
  it('picks the matching per-locale translation for each request', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          de: 'Speichern',
          sv: 'Spara',
        },
      ],
    });

    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
    ]);

    expect(results).toEqual([
      'Spara',
      'Speichern',
    ]);
  });

  it('folds identical sources across locales into a single translate call', async () => {
    let calls = 0;
    let receivedItems: number | undefined;
    let receivedLocales: string[] | undefined;
    const translator = createTranslator({
      translate: (params: TranslateBatchRequest) => {
        calls += 1;
        receivedItems = params.items.length;
        receivedLocales = params.targetLocales;
        return params.items.map(() => ({
          de: 'Speichern',
          fr: 'Enregistrer',
          sv: 'Spara',
        }));
      },
    });

    await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'fr',
      },
    ]);

    expect(calls).toBe(1);
    expect(receivedItems).toBe(1);
    expect(receivedLocales).toEqual([
      'de',
      'fr',
      'sv',
    ]);
  });

  it('returns the union of target locales sorted alphabetically', async () => {
    let receivedLocales: string[] | undefined;
    const translator = createTranslator({
      translate: (params: TranslateBatchRequest) => {
        receivedLocales = params.targetLocales;
        return params.items.map(() => ({
          de: 'b',
          fr: 'c',
          sv: 'a',
        }));
      },
    });

    await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'fr',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
    ]);

    expect(receivedLocales).toEqual([
      'de',
      'fr',
      'sv',
    ]);
  });

  it('holds an empty string when the translate response is missing a locale key', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          sv: 'Spara',
        },
      ],
    });

    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
    ]);

    expect(results).toEqual([
      'Spara',
      '',
    ]);
  });

  it('builds chunks by unique source count, not raw request count', async () => {
    let calls = 0;
    const chunkSizes: number[] = [];
    const translator = createTranslator({
      batchSize: 2,
      translate: (params: TranslateBatchRequest) => {
        calls += 1;
        chunkSizes.push(params.items.length);
        return params.items.map(() => ({
          de: 'y',
          sv: 'x',
        }));
      },
    });

    await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Cancel',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Cancel',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
      {
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'de',
      },
    ]);

    expect(calls).toBe(2);
    expect(chunkSizes.sort()).toEqual([
      1,
      2,
    ]);
  });

  it('refuses construction when batchSize is not a positive integer', () => {
    expect(() =>
      createTranslator({
        batchSize: 0,
        translate: () => [],
      }),
    ).toThrow(/batchSize must be a positive integer/);
  });

  it('refuses construction when concurrency is not a positive integer', () => {
    expect(() =>
      createTranslator({
        concurrency: -1,
        translate: () => [],
      }),
    ).toThrow(/concurrency must be a positive integer/);
  });

  it('warns and returns an empty result when the translate response is not an array', async () => {
    const translator = createTranslator({
      translate: () =>
        ({
          not: 'array',
        }) as unknown as never,
    });
    const warnSpy =
      vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
    setWarn(warnSpy);
    try {
      const results = await translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]);
      expect(results).toEqual([
        '',
      ]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('chunk failed'),
        expect.objectContaining({
          code: 'YPK_TRANSLATE_CHUNK_FAILED',
        }),
      );
    } finally {
      resetWarn();
    }
  });

  it('warns and returns an empty result when the translate response has the wrong length', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          sv: 'Spara',
        },
        {
          sv: 'extra',
        },
      ],
    });
    const warnSpy =
      vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
    setWarn(warnSpy);
    try {
      const results = await translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]);
      expect(results).toEqual([
        '',
      ]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('chunk failed'),
        expect.objectContaining({
          code: 'YPK_TRANSLATE_CHUNK_FAILED',
        }),
      );
    } finally {
      resetWarn();
    }
  });

  it('returns an empty string when a translate response entry is not an object', async () => {
    const translator = createTranslator({
      translate: () => [
        null as unknown as never,
      ],
    });
    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(results).toEqual([
      '',
    ]);
  });

  it('warns when a translate response entry is a string instead of an object', async () => {
    const translator = createTranslator({
      translate: () => [
        'Spara' as unknown as never,
      ],
    });
    const warnSpy =
      vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
    setWarn(warnSpy);
    try {
      const results = await translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]);
      expect(results).toEqual([
        '',
      ]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected an object keyed by target locales'),
        expect.objectContaining({
          code: 'YPK_TRANSLATE_ENTRY_SHAPE',
        }),
      );
    } finally {
      resetWarn();
    }
  });

  it('warns when a translate response entry is an array instead of an object', async () => {
    const translator = createTranslator({
      translate: () => [
        [
          'Spara',
        ] as unknown as never,
      ],
    });
    const warnSpy =
      vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
    setWarn(warnSpy);
    try {
      await translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('an array'),
        expect.objectContaining({
          code: 'YPK_TRANSLATE_ENTRY_SHAPE',
        }),
      );
    } finally {
      resetWarn();
    }
  });

  it('returns an empty string for a translation whose value is not a string', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          sv: 42 as unknown as string,
        },
      ],
    });
    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(results).toEqual([
      '',
    ]);
  });

  it('returns an empty string for a translation that is blank after trim', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          sv: '   ',
        },
      ],
    });
    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(results).toEqual([
      '',
    ]);
  });

  it('returns an empty string when calling `single` on an unknown source', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          sv: 'Spara',
        },
      ],
    });
    const result = await translator({
      fileId: 'src/a.tsx',
      source: 'Save',
      sourceLocale: 'en',
      targetLocale: 'de',
    });
    expect(result).toBe('');
  });

  it('returns an empty array when given no requests', async () => {
    const translator = createTranslator({
      translate: () => [],
    });
    const result = await translator.batch?.([]);
    expect(result).toEqual([]);
  });

  it('builds an item with `disambiguation` and `examples` from the request', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator({
      translate: (params) => {
        receivedItems = params.items;
        return params.items.map(() => ({
          sv: 'Spara',
        }));
      },
    });
    await translator.batch?.([
      {
        disambiguation: 'button',
        examples: [
          {
            source: 'Save',
            translation: 'Spara',
          },
        ],
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(receivedItems).toEqual([
      {
        disambiguation: 'button',
        examples: [
          {
            source: 'Save',
            translation: 'Spara',
          },
        ],
        source: 'Save',
      },
    ]);
  });

  it('builds an item without context fields when `context` is `none`', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator({
      context: 'none',
      translate: (params) => {
        receivedItems = params.items;
        return params.items.map(() => ({
          sv: 'Spara',
        }));
      },
    });
    await translator.batch?.([
      {
        context: {
          componentName: 'Header',
          enclosingElement: 'h1',
          snippet: '<h1>Save</h1>',
        },
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(receivedItems).toEqual([
      {
        source: 'Save',
      },
    ]);
  });

  it('builds an item with `componentName` and `enclosingElement` at `minimal` context', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator({
      translate: (params) => {
        receivedItems = params.items;
        return params.items.map(() => ({
          sv: 'Spara',
        }));
      },
    });
    await translator.batch?.([
      {
        context: {
          componentName: 'Header',
          enclosingElement: 'h1',
          snippet: '<h1>Save</h1>',
        },
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    const item = receivedItems?.[0] as Record<string, unknown>;
    expect(item.component).toBe('Header');
    expect(item.element).toBe('h1');
    expect(item.snippet).toBeUndefined();
  });

  it('throws when the abort signal is already aborted before batch starts', async () => {
    const translator = createTranslator({
      translate: () => [
        {
          sv: 'Spara',
        },
      ],
    });
    const controller = new AbortController();
    controller.abort(new Error('Cancelled before start.'));
    await expect(
      translator.batch?.(
        [
          {
            fileId: 'src/a.tsx',
            source: 'Save',
            sourceLocale: 'en',
            targetLocale: 'sv',
          },
        ],
        {
          signal: controller.signal,
        },
      ),
    ).rejects.toThrow(/Cancelled before start/);
  });

  it('notifies the translate callback with the abort signal', async () => {
    let receivedSignal: AbortSignal | undefined;
    const translator = createTranslator({
      translate: (params) => {
        receivedSignal = params.signal;
        return params.items.map(() => ({
          sv: 'Spara',
        }));
      },
    });
    const controller = new AbortController();
    await translator.batch?.(
      [
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ],
      {
        signal: controller.signal,
      },
    );
    expect(receivedSignal).toBe(controller.signal);
  });

  it('builds an item with `snippet` only when context is `rich`', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator({
      context: 'rich',
      translate: (params) => {
        receivedItems = params.items;
        return params.items.map(() => ({
          sv: 'Spara',
        }));
      },
    });
    await translator.batch?.([
      {
        context: {
          componentName: '',
          enclosingElement: '',
          snippet: '<h1>Save</h1>',
        },
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    const item = receivedItems?.[0] as Record<string, unknown>;
    expect(item.snippet).toBe('<h1>Save</h1>');
    expect(item.component).toBeUndefined();
  });

  it('notifies `onChunkError` for every failed chunk', async () => {
    const translator = createTranslator({
      batchSize: 1,
      translate: (params) => {
        if (params.items.some((item) => item.source === 'Save')) {
          throw new Error('Transient API error');
        }
        return params.items.map(() => ({
          sv: 'Avbryt',
        }));
      },
    });
    const failedSources: string[] = [];
    const onChunkError = (
      _error: unknown,
      requests: TranslateRequest[],
    ): void => {
      for (const request of requests) {
        failedSources.push(request.source);
      }
    };
    await translator.batch?.(
      [
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
        {
          fileId: 'src/a.tsx',
          source: 'Cancel',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ],
      {
        onChunkError,
      },
    );
    expect(failedSources).toEqual([
      'Save',
    ]);
  });

  it('preserves every succeeded chunk result when another chunk fails', async () => {
    const translator = createTranslator({
      batchSize: 1,
      translate: (params) => {
        if (params.items.some((item) => item.source === 'Save')) {
          throw new Error('Transient API error');
        }
        return params.items.map(() => ({
          sv: 'Avbryt',
        }));
      },
    });
    const results = await translator.batch?.(
      [
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
        {
          fileId: 'src/a.tsx',
          source: 'Cancel',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ],
      {
        onChunkError: () => {},
      },
    );
    expect(results).toEqual([
      '',
      'Avbryt',
    ]);
  });
});
