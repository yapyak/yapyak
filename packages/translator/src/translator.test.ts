import type { TranslateBatchRequest } from './type';

import { describe, expect, it } from 'vitest';

import { createTranslator } from './translator';

describe('createTranslator', () => {
  it('picks the matching per-locale translation for each request', async () => {
    const translator = createTranslator({
      translate: () => [{ de: 'Speichern', sv: 'Spara' }],
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

    expect(results).toEqual(['Spara', 'Speichern']);
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
    expect(receivedLocales).toEqual(['de', 'fr', 'sv']);
  });

  it('returns the union of target locales sorted alphabetically', async () => {
    let receivedLocales: string[] | undefined;
    const translator = createTranslator({
      translate: (params: TranslateBatchRequest) => {
        receivedLocales = params.targetLocales;
        return params.items.map(() => ({ de: 'b', fr: 'c', sv: 'a' }));
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

    expect(receivedLocales).toEqual(['de', 'fr', 'sv']);
  });

  it('holds an empty string when the translate response is missing a locale key', async () => {
    const translator = createTranslator({
      translate: () => [{ sv: 'Spara' }],
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

    expect(results).toEqual(['Spara', '']);
  });

  it('builds chunks by unique source count, not raw request count', async () => {
    let calls = 0;
    const chunkSizes: number[] = [];
    const translator = createTranslator({
      batchSize: 2,
      translate: (params: TranslateBatchRequest) => {
        calls += 1;
        chunkSizes.push(params.items.length);
        return params.items.map(() => ({ de: 'y', sv: 'x' }));
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
    expect(chunkSizes.sort()).toEqual([1, 2]);
  });

  it('refuses construction when batchSize is not a positive integer', () => {
    expect(() =>
      createTranslator({ batchSize: 0, translate: () => [] }),
    ).toThrow(/batchSize must be a positive integer/);
  });

  it('refuses construction when concurrency is not a positive integer', () => {
    expect(() =>
      createTranslator({ concurrency: -1, translate: () => [] }),
    ).toThrow(/concurrency must be a positive integer/);
  });
});
