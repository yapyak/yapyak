import type { TransformFileRequest } from './type';

import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { transformFile } from './transform';
import { createHash } from 'node:crypto';

function runTransform(input: {
  source: string;
  locales: readonly string[];
  translations?: Record<string, Record<string, string>>;
  fileId?: string;
}): string {
  const fileId = input.fileId ?? 'test.tsx';
  const extracted = extractFile({
    fileId,
    locales: input.locales,
    source: input.source,
  });
  const request: TransformFileRequest = {
    extracted,
    fileId,
    locales: input.locales,
    source: input.source,
    translations: input.translations ?? {},
  };
  return transformFile(request).code;
}

describe('transformFile — single-locale elision', () => {
  it('elides $t(literal) to a plain string literal', () => {
    const code = runTransform({
      locales: ['en'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
    });
    expect(code).toContain('"Hello"');
    expect(code).not.toContain('$t(');
    expect(code).not.toContain('_$pick');
  });

  it('elides $t with simple placeholders to a template literal', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t } from '@yapyak/core';
        export function greet(name) {
          return $t('Hi {name}', { name });
        }
      `,
    });
    expect(code).toContain('`Hi ${name}`');
    expect(code).not.toContain('$t(');
  });

  it('elides multiple placeholders with named expressions', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t } from '@yapyak/core';
        export function summary(name, count) {
          return $t('Hi {name}, you have {count} messages', { name, count });
        }
      `,
    });
    expect(code).toContain('`Hi ${name}, you have ${count} messages`');
  });

  it('preserves arbitrary param expressions in template literal', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t } from '@yapyak/core';
        export function greet() {
          return $t('Hi {name}', { name: getName() });
        }
        declare function getName(): string;
      `,
    });
    expect(code).toContain('`Hi ${getName()}`');
  });

  it('falls back to _$pick when source contains plurals', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t } from '@yapyak/core';
        export function items(count) {
          return $t('{count, plural, one {# item} other {# items}}', { count });
        }
      `,
    });
    expect(code).toContain('_$pick(');
    expect(code).toContain('{ en:');
  });

  it('removes the entire $t import when no references remain', () => {
    const code = runTransform({
      locales: ['en'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
    });
    expect(code).not.toContain("from '@yapyak/core'");
  });

  it('keeps useLocale specifier when still referenced', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t, useLocale } from '@yapyak/core';
        export function Greeting() {
          const [locale] = useLocale();
          return locale + $t('Hello');
        }
      `,
    });
    expect(code).toContain('useLocale');
    expect(code).not.toContain('$t');
    expect(code).toContain("from '@yapyak/core'");
  });
});

describe('transformFile — $createT factory', () => {
  it('removes $createT declaration and elides bound calls to literal in single-locale', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $createT } from '@yapyak/core';
        const $tSv = $createT({ locale: 'sv' });
        export const x = $tSv('Hello');
      `,
    });
    expect(code).not.toContain('$createT');
    expect(code).not.toContain('$tSv');
    expect(code).toContain('"Hello"');
  });

  it('expands $createT-bound call with locale option in multi-locale', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $createT } from '@yapyak/core';
        const $tSv = $createT({ locale: 'sv' });
        export const x = $tSv('Hello');
      `,
      translations: { sv: { [hashId('Hello')]: 'Hej' } },
    });
    expect(code).toContain('_$pick(');
    expect(code).toContain('locale: "sv"');
    expect(code).not.toContain('$createT');
  });

  it('per-call locale override wins over factory locale', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $createT } from '@yapyak/core';
        const $tSv = $createT({ locale: 'sv' });
        export const x = $tSv('Hi {name}', { name }, { locale: 'en' });
      `,
    });
    expect(code).toContain('locale: "en"');
  });
});

describe('transformFile — multi-locale', () => {
  it('emits _$pick with catalog for $t', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
      translations: { sv: { [hashId('Hello')]: 'Hej' } },
    });
    expect(code).toContain('_$pick(');
    expect(code).toContain('en: "Hello"');
    expect(code).toContain('sv: "Hej"');
  });

  it('falls back to source when translation is missing', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
      translations: {},
    });
    expect(code).toContain('sv: "Hello"');
  });

  it('forwards original params object as second arg', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $t } from '@yapyak/core';
        export function greet(name) {
          return $t('Hi {name}', { name });
        }
      `,
    });
    expect(code).toContain('_$pick(');
    expect(code).toContain('{ name }');
  });

  it('strips context option from runtime emit', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $t } from '@yapyak/core';
        export const x = $t('Save', { context: 'submit button' });
      `,
    });
    expect(code).toContain('_$pick(');
    expect(code).not.toContain('context');
  });

  it('adds _$pick to existing @yapyak/core import', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
    });
    expect(code).toMatch(/import \{ _\$pick.*\} from '@yapyak\/core'/);
  });
});

describe('transformFile — source map', () => {
  it('returns a magic-string source map', () => {
    const fileId = 'test.ts';
    const source =
      "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n";
    const extracted = extractFile({ fileId, locales: ['en'], source });
    const result = transformFile({
      extracted,
      fileId,
      locales: ['en'],
      source,
      translations: {},
    });
    expect(result.map.version).toBe(3);
    expect(result.map.sources).toContain(fileId);
    expect(typeof result.map.mappings).toBe('string');
  });
});

function hashId(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 12);
}
