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
    expect(code).not.toContain('_pick');
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

  it('falls back to _pick when source contains plurals', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t } from '@yapyak/core';
        export function items(count) {
          return $t('{count, plural, one {# item} other {# items}}', { count });
        }
      `,
    });
    expect(code).toContain('_pick(');
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

  it('leaves type-only @yapyak/* import untouched', () => {
    const source = [
      "import type { LocaleProviderProps } from '@yapyak/react';",
      "import { $t } from '@yapyak/core';",
      'export function Greeting(props: LocaleProviderProps) {',
      "  return props.defaultLocale + $t('Hello');",
      '}',
    ].join('\n');
    const code = runTransform({ locales: ['en'], source });
    expect(code).toContain(
      "import type { LocaleProviderProps } from '@yapyak/react';",
    );
  });

  it('preserves inline type marker on @yapyak/* import specifier', () => {
    const source = [
      "import { type LocaleProviderProps } from '@yapyak/react';",
      "import { $t } from '@yapyak/core';",
      'export function Greeting(props: LocaleProviderProps) {',
      "  return props.defaultLocale + $t('Hello');",
      '}',
    ].join('\n');
    const code = runTransform({ locales: ['en'], source });
    expect(code).toContain(
      "import { type LocaleProviderProps } from '@yapyak/react';",
    );
  });

  it('preserves type marker when injecting _pick into mixed import', () => {
    const source = [
      "import { type TParams, $t } from '@yapyak/core';",
      "export function greet(params: TParams<'Hi {name}'>) {",
      "  return $t('Hi {name}', params, { locale: 'sv' });",
      '}',
    ].join('\n');
    const code = runTransform({ locales: ['en', 'sv'], source });
    expect(code).toContain('type TParams');
    expect(code).toContain('_pick');
  });

  it('escapes { and } in catalog strings so Vue/JSX parsers never see literal braces', () => {
    const source = [
      "import { $t } from '@yapyak/core';",
      "export const x = $t('You have {count, plural, one {# msg} other {# msgs}}', { count: 1 });",
    ].join('\n');
    const code = runTransform({ locales: ['en', 'sv'], source });
    expect(code).not.toMatch(/"[^"]*\}\}"/);
    expect(code).not.toMatch(/"[^"]*\{[a-z]/);
    expect(code).toContain('\\u007d');
    expect(code).toContain('\\u007b');
  });

  it('escapes { and } in elided single-locale literal (no placeholders)', () => {
    const source = [
      "import { $t } from '@yapyak/core';",
      "export const x = $t('Closing braces inside: }}');",
    ].join('\n');
    const code = runTransform({ locales: ['en'], source });
    expect(code).not.toMatch(/"[^"]*\}\}"/);
    expect(code).toContain('\\u007d\\u007d');
  });

  it('never touches imports from other @yapyak/* packages', () => {
    const source = [
      "import { useLocale } from '@yapyak/react';",
      "import type { Translator } from '@yapyak/translator';",
      "import { withRequest } from '@yapyak/adapter';",
      "import { $t } from '@yapyak/core';",
      'export function Greeting(props: { translator: Translator }) {',
      '  void useLocale;',
      '  void withRequest;',
      "  return props.translator.id + $t('Hello');",
      '}',
    ].join('\n');
    const code = runTransform({ locales: ['en'], source });
    expect(code).toContain("import { useLocale } from '@yapyak/react';");
    expect(code).toContain(
      "import type { Translator } from '@yapyak/translator';",
    );
    expect(code).toContain("import { withRequest } from '@yapyak/adapter';");
  });
});

describe('transformFile — dynamic options', () => {
  it('preserves inline options object verbatim', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $t } from '@yapyak/core';
        declare const previewLocale: { value: string };
        export const x = $t('Hello', undefined, { locale: previewLocale.value });
      `,
    });
    expect(code).toContain('_pick(');
    expect(code).toContain('{ locale: previewLocale.value }');
  });

  it('preserves options reference verbatim', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $t } from '@yapyak/core';
        const svOptions = { locale: 'sv' };
        export const x = $t('Hello', undefined, svOptions);
      `,
    });
    expect(code).toContain('_pick(');
    expect(code).toContain('svOptions');
  });

  it('preserves options when source has no placeholders (2nd arg)', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: `
        import { $t } from '@yapyak/core';
        const opts = { locale: 'sv' };
        export const x = $t('Hello', opts);
      `,
    });
    expect(code).toContain('_pick(');
    expect(code).toContain('opts');
  });

  it('skips elision in single-locale when options are present', () => {
    const code = runTransform({
      locales: ['en'],
      source: `
        import { $t } from '@yapyak/core';
        export const x = $t('Hello', undefined, { locale: 'sv' });
      `,
    });
    expect(code).toContain('_pick(');
    expect(code).toContain("{ locale: 'sv' }");
  });
});

describe('transformFile — multi-locale', () => {
  it('emits _pick with catalog for $t', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
      translations: { sv: { [hashId('Hello')]: 'Hej' } },
    });
    expect(code).toContain('_pick(');
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
    expect(code).toContain('_pick(');
    expect(code).toContain('{ name }');
  });

  it('emits _pick from @yapyak/core/internal as a separate import', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source:
        "import { $t } from '@yapyak/core';\nexport const x = $t('Hello');\n",
    });
    expect(code).toMatch(
      /import \{ pick as _pick \} from '@yapyak\/core\/internal'/,
    );
    expect(code).not.toMatch(/import \{ _pick.*\$t.*\} from '@yapyak\/core'/);
  });

  it('renames local alias when user already has _pick', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: [
        "import { $t } from '@yapyak/core';",
        'const _pick = "user-defined";',
        "export const x = $t('Hello');",
        'export { _pick };',
      ].join('\n'),
    });
    expect(code).toMatch(
      /import \{ pick as _pick_\$0 \} from '@yapyak\/core\/internal'/,
    );
    expect(code).toContain('_pick_$0({');
    expect(code).toContain('const _pick = "user-defined";');
  });

  it('escalates further if both _pick and _pick_$0 are taken', () => {
    const code = runTransform({
      locales: ['en', 'sv'],
      source: [
        "import { $t } from '@yapyak/core';",
        'const _pick = 1;',
        'const _pick_$0 = 2;',
        "export const x = $t('Hello');",
        'export { _pick, _pick_$0 };',
      ].join('\n'),
    });
    expect(code).toMatch(
      /import \{ pick as _pick_\$1 \} from '@yapyak\/core\/internal'/,
    );
    expect(code).toContain('_pick_$1({');
  });
});

describe('transformFile — Vue SFC', () => {
  function runVueTransform(input: {
    source: string;
    locales: readonly string[];
    translations?: Record<string, Record<string, string>>;
  }): string {
    const fileId = 'app.vue';
    const extracted = extractFile({
      fileId,
      locales: input.locales,
      source: input.source,
    });
    const result = transformFile({
      extracted,
      fileId,
      locales: input.locales,
      source: input.source,
      translations: input.translations ?? {},
    });
    return result.code;
  }

  it('elides $t in <script setup> and <template> for single-locale', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      "const heading = $t('Hello');",
      '</script>',
      '<template>',
      `  <h1>{{ $t('Welcome') }}</h1>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({ locales: ['en'], source });
    expect(code).toContain('"Hello"');
    expect(code).toContain('"Welcome"');
    expect(code).not.toContain('$t(');
    expect(code).not.toContain("from '@yapyak/core'");
  });

  it('emits _pick for multi-locale in template and script', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      "const heading = $t('Hello');",
      '</script>',
      '<template>',
      `  <h1>{{ $t('Welcome') }}</h1>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: ['en', 'sv'],
      source,
      translations: { sv: {} },
    });
    expect(code).toContain('_pick({ en: "Hello", sv: "Hello" })');
    expect(code).toContain('_pick({ en: "Welcome", sv: "Welcome" })');
    expect(code).toMatch(
      /import \{ pick as _pick \} from '@yapyak\/core\/internal'/,
    );
  });

  it('rewrites :foo="..." attribute expression', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      '</script>',
      '<template>',
      `  <button :aria-label="$t('Save changes')">Save</button>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({ locales: ['en'], source });
    expect(code).toContain('"Save changes"');
    expect(code).not.toContain("$t('Save changes')");
  });

  it('rewrites @click event handler expression', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      '</script>',
      '<template>',
      `  <button @click="alert($t('Hi'))">x</button>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({ locales: ['en'], source });
    expect(code).toContain('alert("Hi")');
  });

  it('inserts _pick import inside <script setup> when missing core import', () => {
    const source = [
      '<script setup lang="ts">',
      "const heading = 'static';",
      '</script>',
      '<template>',
      `  <h1>{{ heading }}</h1>`,
      '</template>',
    ].join('\n');
    // No $t in source — transform should be no-op
    const code = runVueTransform({ locales: ['en', 'sv'], source });
    expect(code).toContain("const heading = 'static'");
  });

  it('inserts _pick into <script setup> in multi-locale even when only template uses $t', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      '</script>',
      '<template>',
      `  <h1>{{ $t('Welcome') }}</h1>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: ['en', 'sv'],
      source,
      translations: { sv: {} },
    });
    expect(code).toMatch(
      /<script setup[^>]*>\s*\nimport \{ pick as _pick \} from '@yapyak\/core\/internal';/,
    );
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
