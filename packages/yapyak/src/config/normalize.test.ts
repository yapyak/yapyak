import type { Processor } from '../processor';
import type { ContextLevel, Translator } from '../translator';

import { describe, expect, it } from 'vitest';

import { createProcessor } from '../processor';
import { createTranslator } from '../translator';
import { normalizeYapyakConfig } from './normalize';

function makeTranslator(context?: ContextLevel): Translator {
  const options: Parameters<typeof createTranslator>[1] = {};
  if (context !== undefined) {
    options.context = context;
  }
  return createTranslator(() => [], options);
}

describe('normalizeYapyakConfig', () => {
  it('returns the default examples count when no translator is configured', () => {
    const result = normalizeYapyakConfig({});

    expect(result.examples).toBe(5);
  });

  it('returns the default examples count for a translator without an explicit context', () => {
    const result = normalizeYapyakConfig({
      translator: makeTranslator(),
    });

    expect(result.examples).toBe(5);
  });

  it('returns the default examples count for a minimal-context translator', () => {
    const result = normalizeYapyakConfig({
      translator: makeTranslator('minimal'),
    });

    expect(result.examples).toBe(5);
  });

  it('returns zero examples when the translator opts out of call-site context', () => {
    const result = normalizeYapyakConfig({
      translator: makeTranslator('none'),
    });

    expect(result.examples).toBe(0);
  });

  it('preserves an explicit examples count over the context-derived default', () => {
    const result = normalizeYapyakConfig({
      examples: 3,
      translator: makeTranslator('none'),
    });

    expect(result.examples).toBe(3);
  });

  it('preserves an explicit zero examples count regardless of translator context', () => {
    const result = normalizeYapyakConfig({
      examples: 0,
      translator: makeTranslator('rich'),
    });

    expect(result.examples).toBe(0);
  });

  it('holds only vanilla extensions in the include glob when no processors are registered', () => {
    const result = normalizeYapyakConfig({});

    expect(result.include).toEqual([
      'src/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
    ]);
  });

  it("builds the include glob from each registered processor's extensions", () => {
    const result = normalizeYapyakConfig({
      processors: [
        makeProcessor('svelte', [
          '.svelte',
        ]),
      ],
    });

    expect(result.include).toEqual([
      'src/**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx}',
    ]);
  });

  it('builds the include glob from extensions across multiple processors', () => {
    const result = normalizeYapyakConfig({
      processors: [
        makeProcessor('svelte', [
          '.svelte',
        ]),
        makeProcessor('vue', [
          '.vue',
        ]),
      ],
    });

    expect(result.include).toEqual([
      'src/**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx,vue}',
    ]);
  });

  it('folds overlapping extensions across processors into a single glob entry', () => {
    const result = normalizeYapyakConfig({
      processors: [
        makeProcessor('custom', [
          '.ts',
          '.svelte',
        ]),
      ],
    });

    expect(result.include).toEqual([
      'src/**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx}',
    ]);
  });

  it('preserves an explicit include over the derived default', () => {
    const result = normalizeYapyakConfig({
      include: [
        'src/**/*.ts',
      ],
      processors: [
        makeProcessor('svelte', [
          '.svelte',
        ]),
      ],
    });

    expect(result.include).toEqual([
      'src/**/*.ts',
    ]);
  });

  it('normalizes a directory shortcut into a glob with the registered extensions', () => {
    const result = normalizeYapyakConfig({
      include: [
        'app',
      ],
      processors: [
        makeProcessor('vue', [
          '.vue',
        ]),
      ],
    });

    expect(result.include).toEqual([
      'app/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx,vue}',
    ]);
  });

  it('normalizes directory entries while preserving glob entries verbatim in the same array', () => {
    const result = normalizeYapyakConfig({
      include: [
        'src',
        'app/**/*.tsx',
      ],
    });

    expect(result.include).toEqual([
      'src/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
      'app/**/*.tsx',
    ]);
  });

  it('preserves a trailing-slash directory shortcut without doubling separators', () => {
    const result = normalizeYapyakConfig({
      include: [
        'src/',
      ],
    });

    expect(result.include).toEqual([
      'src/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
    ]);
  });

  it('preserves a `RegExp` include verbatim', () => {
    const pattern = /\.svelte$/;
    const result = normalizeYapyakConfig({
      include: pattern,
    });

    expect(result.include).toBe(pattern);
  });

  it('normalizes a directory shortcut in `exclude` into a glob with the registered extensions', () => {
    const result = normalizeYapyakConfig({
      exclude: [
        'legacy',
      ],
    });

    expect(result.exclude).toEqual([
      'legacy/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
    ]);
  });

  it('normalizes directory entries in `exclude` while preserving glob entries verbatim', () => {
    const result = normalizeYapyakConfig({
      exclude: [
        'legacy',
        '**/*.test.*',
      ],
    });

    expect(result.exclude).toEqual([
      'legacy/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
      '**/*.test.*',
    ]);
  });

  it('preserves a `RegExp` exclude verbatim', () => {
    const pattern = /\.deprecated\.ts$/;
    const result = normalizeYapyakConfig({
      exclude: pattern,
    });

    expect(result.exclude).toBe(pattern);
  });

  it('preserves an explicit file path with a registered extension verbatim', () => {
    const result = normalizeYapyakConfig({
      include: [
        'src/Button.tsx',
      ],
    });

    expect(result.include).toEqual([
      'src/Button.tsx',
    ]);
  });

  it('normalizes a directory path whose name contains a dot that is not a registered extension', () => {
    const result = normalizeYapyakConfig({
      include: [
        'src/feature.module',
      ],
    });

    expect(result.include).toEqual([
      'src/feature.module/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
    ]);
  });

  it('preserves an explicit file path whose extension comes from a registered processor', () => {
    const result = normalizeYapyakConfig({
      include: [
        'src/App.vue',
      ],
      processors: [
        makeProcessor('vue', [
          '.vue',
        ]),
      ],
    });

    expect(result.include).toEqual([
      'src/App.vue',
    ]);
  });

  it('throws when an include entry is an empty string', () => {
    expect(() =>
      normalizeYapyakConfig({
        include: [
          '',
        ],
      }),
    ).toThrow(/include\/exclude entry cannot be an empty string/);
  });

  it('preserves a `RegExp` inside an include array verbatim', () => {
    const pattern = /\.special$/;
    const result = normalizeYapyakConfig({
      include: [
        pattern,
      ],
    });
    expect(result.include).toEqual([
      pattern,
    ]);
  });

  it('normalizes a single non-array include string into a directory glob', () => {
    const result = normalizeYapyakConfig({
      include: 'src',
    });
    expect(result.include).toBe('src/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}');
  });

  it('returns a `none` persistence config when none is configured', () => {
    const result = normalizeYapyakConfig({});
    expect(result.persistence).toEqual({
      type: 'none',
    });
  });

  it('returns the default cookie config for the `cookie` shorthand', () => {
    const result = normalizeYapyakConfig({
      persistence: 'cookie',
    });
    expect(result.persistence).toEqual({
      name: 'locale',
      secure: false,
      type: 'cookie',
    });
  });

  it('returns the default local-storage config for the `local-storage` shorthand', () => {
    const result = normalizeYapyakConfig({
      persistence: 'local-storage',
    });
    expect(result.persistence).toEqual({
      key: 'locale',
      type: 'local-storage',
    });
  });

  it('returns the default url config for the `url` shorthand', () => {
    const result = normalizeYapyakConfig({
      persistence: 'url',
    });
    expect(result.persistence).toEqual({
      type: 'url',
    });
  });

  it('returns the explicit `none` config for the `none` shorthand', () => {
    const result = normalizeYapyakConfig({
      persistence: 'none',
    });
    expect(result.persistence).toEqual({
      type: 'none',
    });
  });

  it('preserves an explicit cookie name on a cookie persistence config', () => {
    const result = normalizeYapyakConfig({
      persistence: {
        name: 'my_locale',
        type: 'cookie',
      },
    });
    expect(result.persistence).toEqual({
      name: 'my_locale',
      secure: false,
      type: 'cookie',
    });
  });

  it('preserves an explicit local-storage key on a local-storage config', () => {
    const result = normalizeYapyakConfig({
      persistence: {
        key: 'my.locale',
        type: 'local-storage',
      },
    });
    expect(result.persistence).toEqual({
      key: 'my.locale',
      type: 'local-storage',
    });
  });

  it('preserves a `match` matcher on a url persistence config', () => {
    const match = /^\/(en|sv)/;
    const result = normalizeYapyakConfig({
      persistence: {
        match,
        type: 'url',
      },
    });
    expect(result.persistence).toEqual({
      match,
      type: 'url',
    });
  });

  it('returns the explicit `none` type on an object-form persistence config', () => {
    const result = normalizeYapyakConfig({
      persistence: {
        type: 'none',
      },
    });
    expect(result.persistence).toEqual({
      type: 'none',
    });
  });
});

function makeProcessor(id: string, extensions: string[]): Processor {
  return createProcessor(
    () => undefined,
    extensions,
    id,
    () => [],
  );
}
