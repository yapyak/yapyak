import type { Processor } from '../processor';

import { describe, expect, it } from 'vitest';

import { createProcessor } from '../processor';
import { createFilter } from './filter';
import { normalizeYapyakConfig } from './normalize';

describe('normalizeYapyakConfig', () => {
  it('holds only vanilla extensions in the include glob when no processors are registered', () => {
    const result = normalizeYapyakConfig({});

    expect(result.include).toEqual([
      './**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}',
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
      './**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx}',
    ]);
  });

  it('flattens nested processor arrays', () => {
    const inner = createProcessor({
      extensions: [
        '.vue',
      ],
      id: 'vue',
    });
    const normalized = normalizeYapyakConfig({
      processors: [
        [
          inner,
        ],
      ],
    });
    expect(normalized.processors).toEqual([
      inner,
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
      './**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx,vue}',
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
      './**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx}',
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
    const patternRx = /\.svelte$/;
    const result = normalizeYapyakConfig({
      include: patternRx,
    });

    expect(result.include).toBe(patternRx);
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
    const patternRx = /\.deprecated\.ts$/;
    const result = normalizeYapyakConfig({
      exclude: patternRx,
    });

    expect(result.exclude).toBe(patternRx);
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

  it('throws when `autoTranslateThreshold` is a negative integer', () => {
    expect(() =>
      normalizeYapyakConfig({
        autoTranslateThreshold: -1,
      }),
    ).toThrow(/autoTranslateThreshold must be a non-negative integer/);
  });

  it('throws when `autoTranslateThreshold` is a fractional number', () => {
    expect(() =>
      normalizeYapyakConfig({
        autoTranslateThreshold: 1.5,
      }),
    ).toThrow(/autoTranslateThreshold must be a non-negative integer/);
  });

  it('throws when `defaultLocale` is an empty string', () => {
    expect(() =>
      normalizeYapyakConfig({
        defaultLocale: '',
      }),
    ).toThrow(/defaultLocale cannot be an empty string/);
  });

  it('throws when `localesDir` is an empty string', () => {
    expect(() =>
      normalizeYapyakConfig({
        localesDir: '',
      }),
    ).toThrow(/localesDir cannot be an empty string/);
  });

  it('preserves a `RegExp` inside an include array verbatim', () => {
    const patternRx = /\.special$/;
    const result = normalizeYapyakConfig({
      include: [
        patternRx,
      ],
    });
    expect(result.include).toEqual([
      patternRx,
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
    const matchRx = /^\/(en|sv)/;
    const result = normalizeYapyakConfig({
      persistence: {
        match: matchRx,
        type: 'url',
      },
    });
    expect(result.persistence).toEqual({
      match: matchRx,
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

  it('throws when the persistence shorthand is unknown', () => {
    expect(() =>
      normalizeYapyakConfig({
        persistence: 'cookei' as never,
      }),
    ).toThrow(/unknown persistence strategy/);
  });

  it('throws when the persistence object type is unknown', () => {
    expect(() =>
      normalizeYapyakConfig({
        persistence: {
          type: 'cookei',
        } as never,
      }),
    ).toThrow(/unknown persistence type/);
  });
});

function makeProcessor(id: string, extensions: string[]): Processor {
  return createProcessor({
    extensions,
    id,
  });
}

describe('normalizeYapyakConfig root include default', () => {
  function buildFilter(): (fileId: string) => boolean {
    const normalized = normalizeYapyakConfig({
      processors: [
        createProcessor({
          extensions: [
            '.vue',
          ],
          id: 'vue',
        }),
      ],
    });
    return createFilter(normalized.include, normalized.exclude);
  }

  it('accepts source files anywhere under the project root', () => {
    const filter = buildFilter();
    expect(filter('src/a.ts')).toBe(true);
    expect(filter('app/app.vue')).toBe(true);
    expect(filter('composables/use-thing.ts')).toBe(true);
    expect(filter('a.ts')).toBe(true);
  });

  it('refuses files under `node_modules` and build output directories', () => {
    const filter = buildFilter();
    expect(filter('node_modules/pkg/index.ts')).toBe(false);
    expect(filter('apps/web/node_modules/pkg/index.ts')).toBe(false);
    expect(filter('dist/a.ts')).toBe(false);
    expect(filter('build/a.ts')).toBe(false);
    expect(filter('coverage/a.ts')).toBe(false);
  });

  it('refuses files inside dot directories and outside the project root', () => {
    const filter = buildFilter();
    expect(filter('.nuxt/dev/index.ts')).toBe(false);
    expect(filter('.output/server/a.ts')).toBe(false);
    expect(filter('../sibling/a.ts')).toBe(false);
  });

  it('refuses yapyak config files', () => {
    const filter = buildFilter();
    expect(filter('yapyak.config.ts')).toBe(false);
    expect(filter('yapyak.config.mjs')).toBe(false);
    expect(filter('apps/web/yapyak.config.ts')).toBe(false);
  });

  it('narrows extraction to the listed patterns when `include` is set', () => {
    const normalized = normalizeYapyakConfig({
      include: [
        'apps/web',
      ],
      processors: [],
    });
    const filter = createFilter(normalized.include, normalized.exclude);
    expect(filter('apps/web/a.ts')).toBe(true);
    expect(filter('apps/docs/a.ts')).toBe(false);
  });
});
