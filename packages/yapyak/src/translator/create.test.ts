import type { TranslateBatchRequest } from './type';

import { describe, expect, it } from 'vitest';

import { createTranslator } from './create';

describe('createTranslator', () => {
  it('picks the matching per-locale translation for each request', async () => {
    const translator = createTranslator(() => [
      { de: 'Speichern', sv: 'Spara' },
    ]);

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
    const translator = createTranslator((params: TranslateBatchRequest) => {
      calls += 1;
      receivedItems = params.items.length;
      receivedLocales = params.targetLocales;
      return params.items.map(() => ({
        de: 'Speichern',
        fr: 'Enregistrer',
        sv: 'Spara',
      }));
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
    const translator = createTranslator((params: TranslateBatchRequest) => {
      receivedLocales = params.targetLocales;
      return params.items.map(() => ({ de: 'b', fr: 'c', sv: 'a' }));
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
    const translator = createTranslator(() => [{ sv: 'Spara' }]);

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
    const translator = createTranslator(
      (params: TranslateBatchRequest) => {
        calls += 1;
        chunkSizes.push(params.items.length);
        return params.items.map(() => ({ de: 'y', sv: 'x' }));
      },
      { batchSize: 2 },
    );

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
    expect(() => createTranslator(() => [], { batchSize: 0 })).toThrow(
      /batchSize must be a positive integer/,
    );
  });

  it('refuses construction when concurrency is not a positive integer', () => {
    expect(() => createTranslator(() => [], { concurrency: -1 })).toThrow(
      /concurrency must be a positive integer/,
    );
  });

  it('throws when the translate response is not an array', async () => {
    const translator = createTranslator(
      () => ({ not: 'array' }) as unknown as never,
    );
    await expect(
      translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]),
    ).rejects.toThrow(/must return an array/);
  });

  it('throws when the translate response has the wrong length', async () => {
    const translator = createTranslator(() => [
      { sv: 'Spara' },
      { sv: 'extra' },
    ]);
    await expect(
      translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]),
    ).rejects.toThrow(/returned 2 items, expected 1/);
  });

  it('returns an empty string when a translate response entry is not an object', async () => {
    const translator = createTranslator(() => [null as unknown as never]);
    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(results).toEqual(['']);
  });

  it('returns an empty string for a translation whose value is not a string', async () => {
    const translator = createTranslator(() => [
      { sv: 42 as unknown as string },
    ]);
    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(results).toEqual(['']);
  });

  it('returns an empty string for a translation that is blank after trim', async () => {
    const translator = createTranslator(() => [{ sv: '   ' }]);
    const results = await translator.batch?.([
      {
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(results).toEqual(['']);
  });

  it('returns an empty string when calling `single` on an unknown source', async () => {
    const translator = createTranslator(() => [{ sv: 'Spara' }]);
    const result = await translator({
      fileId: 'src/a.tsx',
      source: 'Save',
      sourceLocale: 'en',
      targetLocale: 'de',
    });
    expect(result).toBe('');
  });

  it('returns an empty array when given no requests', async () => {
    const translator = createTranslator(() => []);
    const result = await translator.batch?.([]);
    expect(result).toEqual([]);
  });

  it('builds an item with `disambiguation` and `examples` from the request', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator((params) => {
      receivedItems = params.items;
      return params.items.map(() => ({ sv: 'Spara' }));
    });
    await translator.batch?.([
      {
        disambiguation: 'button',
        examples: [{ source: 'Save', translation: 'Spara' }],
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      },
    ]);
    expect(receivedItems).toEqual([
      {
        disambiguation: 'button',
        examples: [{ source: 'Save', translation: 'Spara' }],
        source: 'Save',
      },
    ]);
  });

  it('builds an item without context fields when `context` is `none`', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator(
      (params) => {
        receivedItems = params.items;
        return params.items.map(() => ({ sv: 'Spara' }));
      },
      { context: 'none' },
    );
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
    expect(receivedItems).toEqual([{ source: 'Save' }]);
  });

  it('builds an item with `componentName` and `enclosingElement` at `minimal` context', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator((params) => {
      receivedItems = params.items;
      return params.items.map(() => ({ sv: 'Spara' }));
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

  it('builds an item with `snippet` only when context is `rich`', async () => {
    let receivedItems: unknown[] | undefined;
    const translator = createTranslator(
      (params) => {
        receivedItems = params.items;
        return params.items.map(() => ({ sv: 'Spara' }));
      },
      { context: 'rich' },
    );
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
});
