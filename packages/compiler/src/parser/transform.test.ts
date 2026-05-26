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

function hashId(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 12);
}

describe('transformFile', () => {
  describe('single-locale elision', () => {
    it('elides t(literal) to a plain string literal', () => {
      const code = runTransform({
        locales: ['en'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).toContain('"Hello"');
      expect(code).not.toContain("t('Hello')");
      expect(code).not.toContain('_pick');
    });

    it('elides t with simple placeholders to a template literal', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function greet(name) {
            return t('Hi {name}', { name });
          }
        `,
      });
      expect(code).toContain('`Hi ${name}`');
      expect(code).not.toContain("t('Hi {name}'");
    });

    it('elides multiple placeholders with named expressions', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function summary(name, count) {
            return t('Hi {name}, you have {count} messages', { name, count });
          }
        `,
      });
      expect(code).toContain('`Hi ${name}, you have ${count} messages`');
    });

    it('preserves arbitrary param expressions in template literal', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function greet() {
            return t('Hi {name}', { name: getName() });
          }
          declare function getName(): string;
        `,
      });
      expect(code).toContain('`Hi ${getName()}`');
    });

    it('emits _pick when source contains plurals', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function items(count) {
            return t('{count, plural, one {# item} other {# items}}', { count });
          }
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('{ en:');
    });

    it('removes the entire t import when no references remain', () => {
      const code = runTransform({
        locales: ['en'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).not.toContain("from 'yapyak'");
    });

    it('keeps useLocale specifier when still referenced', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t, useLocale } from 'yapyak';
          export function Greeting() {
            const [locale] = useLocale();
            return locale + t('Hello');
          }
        `,
      });
      expect(code).toContain('useLocale');
      expect(code).not.toContain('t(');
      expect(code).toContain("from 'yapyak'");
    });

    it('leaves type-only @yapyak/* imports untouched', () => {
      const source = [
        "import type { LocaleProviderProps } from '@yapyak/react';",
        "import { t } from 'yapyak';",
        'export function Greeting(props: LocaleProviderProps) {',
        "  return props.defaultLocale + t('Hello');",
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
        "import { t } from 'yapyak';",
        'export function Greeting(props: LocaleProviderProps) {',
        "  return props.defaultLocale + t('Hello');",
        '}',
      ].join('\n');
      const code = runTransform({ locales: ['en'], source });
      expect(code).toContain(
        "import { type LocaleProviderProps } from '@yapyak/react';",
      );
    });

    it('preserves type marker when injecting _pick into a mixed import', () => {
      const source = [
        "import { type TParams, t } from 'yapyak';",
        "export function greet(params: TParams<'Hi {name}'>) {",
        "  return t('Hi {name}', params, { locale: 'sv' });",
        '}',
      ].join('\n');
      const code = runTransform({ locales: ['en', 'sv'], source });
      expect(code).toContain('type TParams');
      expect(code).toContain('_pick');
    });

    it('escapes { and } in catalog strings so Vue/JSX parsers never see literal braces', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('You have {count, plural, one {# msg} other {# msgs}}', { count: 1 });",
      ].join('\n');
      const code = runTransform({ locales: ['en', 'sv'], source });
      expect(code).not.toMatch(/"[^"]*\}\}"/);
      expect(code).not.toMatch(/"[^"]*\{[a-z]/);
      expect(code).toContain('\\u007d');
      expect(code).toContain('\\u007b');
    });

    it('escapes { and } in elided single-locale literal without placeholders', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('Closing braces inside: }}');",
      ].join('\n');
      const code = runTransform({ locales: ['en'], source });
      expect(code).not.toMatch(/"[^"]*\}\}"/);
      expect(code).toContain('\\u007d\\u007d');
    });

    it('leaves imports from other @yapyak/* packages untouched', () => {
      const source = [
        "import { useLocale } from '@yapyak/react';",
        "import type { Translator } from '@yapyak/translator';",
        "import { withRequest } from '@yapyak/adapter';",
        "import { t } from 'yapyak';",
        'export function Greeting(props: { translator: Translator }) {',
        '  void useLocale;',
        '  void withRequest;',
        "  return props.translator.id + t('Hello');",
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

  describe('with dynamic options', () => {
    it('preserves inline options object verbatim', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          declare const previewLocale: { value: string };
          export const x = t('Hello', undefined, { locale: previewLocale.value });
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('{ locale: previewLocale.value }');
    });

    it('preserves options reference verbatim', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          const svOptions = { locale: 'sv' };
          export const x = t('Hello', undefined, svOptions);
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('svOptions');
    });

    it('preserves options when source has no placeholders (2nd arg)', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          const opts = { locale: 'sv' };
          export const x = t('Hello', opts);
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('opts');
    });

    it('skips single-locale elision when options are present', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export const x = t('Hello', undefined, { locale: 'sv' });
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain("{ locale: 'sv' }");
    });
  });

  describe('multi-locale', () => {
    it('emits _pick with catalog for t', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: { sv: { [hashId('Hello')]: 'Hej' } },
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('en: "Hello"');
      expect(code).toContain('sv: "Hej"');
    });

    it('emits source as the fallback when a translation is missing', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: {},
      });
      expect(code).toContain('sv: "Hello"');
    });

    it('forwards original params object as second arg', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          export function greet(name) {
            return t('Hi {name}', { name });
          }
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('{ name }');
    });

    it('emits _pick from yapyak/internal as a separate import', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).toMatch(
        /import \{ pick as _pick \} from 'yapyak\/internal'/,
      );
      expect(code).not.toMatch(/import \{ _pick.*\t.*\} from 'yapyak'/);
    });

    it('renames local alias when user already has _pick', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: [
          "import { t } from 'yapyak';",
          'const _pick = "user-defined";',
          "export const x = t('Hello');",
          'export { _pick };',
        ].join('\n'),
      });
      expect(code).toMatch(
        /import \{ pick as _pick_\$0 \} from 'yapyak\/internal'/,
      );
      expect(code).toContain('_pick_$0({');
      expect(code).toContain('const _pick = "user-defined";');
    });

    it('escalates further if both _pick and _pick_$0 are taken', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: [
          "import { t } from 'yapyak';",
          'const _pick = 1;',
          'const _pick_$0 = 2;',
          "export const x = t('Hello');",
          'export { _pick, _pick_$0 };',
        ].join('\n'),
      });
      expect(code).toMatch(
        /import \{ pick as _pick_\$1 \} from 'yapyak\/internal'/,
      );
      expect(code).toContain('_pick_$1({');
    });
  });

  describe('with Vue SFC', () => {
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

    it('elides t in <script setup> and <template> for single-locale', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const heading = t('Hello');",
        '</script>',
        '<template>',
        `  <h1>{{ t('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en'], source });
      expect(code).toContain('"Hello"');
      expect(code).toContain('<h1>Welcome</h1>');
      expect(code).not.toContain("t('Hello')");
      expect(code).not.toContain("t('Welcome')");
      expect(code).not.toContain("from 'yapyak'");
    });

    it('emits _pick for multi-locale in template and script', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const heading = t('Hello');",
        '</script>',
        '<template>',
        `  <h1>{{ t('Welcome') }}</h1>`,
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
        /import \{ pick as _pick \} from 'yapyak\/internal'/,
      );
    });

    it('rewrites :foo="..." attribute expression', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <button :aria-label="t('Save changes')">Save</button>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en'], source });
      expect(code).toContain('"Save changes"');
      expect(code).not.toContain("t('Save changes')");
    });

    it('rewrites @click event handler expression', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <button @click="alert(t('Hi'))">x</button>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en'], source });
      expect(code).toContain('alert("Hi")');
    });

    it('leaves <script setup> alone when there is no core t import', () => {
      const source = [
        '<script setup lang="ts">',
        "const heading = 'static';",
        '</script>',
        '<template>',
        `  <h1>{{ heading }}</h1>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en', 'sv'], source });
      expect(code).toContain("const heading = 'static'");
    });

    it('inserts _pick into <script setup> in multi-locale even when only template uses t', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <h1>{{ t('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({
        locales: ['en', 'sv'],
        source,
        translations: { sv: {} },
      });
      expect(code).toMatch(
        /<script setup[^>]*>\s*\nimport \{ pick as _pick \} from 'yapyak\/internal';/,
      );
    });
  });

  describe('with bare-string elision in templates', () => {
    function runVueTransform(
      source: string,
      locales: readonly string[],
    ): string {
      const fileId = 'app.vue';
      const extracted = extractFile({ fileId, locales, source });
      return transformFile({
        extracted,
        fileId,
        locales,
        source,
        translations: {},
      }).code;
    }

    function runSvelteTransform(
      source: string,
      locales: readonly string[],
    ): string {
      const fileId = 'app.svelte';
      const extracted = extractFile({ fileId, locales, source });
      return transformFile({
        extracted,
        fileId,
        locales,
        source,
        translations: {},
      }).code;
    }

    function runAstroTransform(
      source: string,
      locales: readonly string[],
    ): string {
      const fileId = 'page.astro';
      const extracted = extractFile({ fileId, locales, source });
      return transformFile({
        extracted,
        fileId,
        locales,
        source,
        translations: {},
      }).code;
    }

    it('elides JSX text <p>{t("Hello")}</p> to <p>Hello</p>', () => {
      const code = runTransform({
        locales: ['en'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t('Hello')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain('<p>Hello</p>');
      expect(code).not.toContain('{"Hello"}');
    });

    it('elides JSX attribute aria-label={t("Save")} to aria-label="Save"', () => {
      const code = runTransform({
        locales: ['en'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <button aria-label={t('Save')}>x</button>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain('aria-label="Save"');
      expect(code).not.toContain('aria-label={');
    });

    it('elides Vue mustache {{ t("Hello") }} to bare Hello', () => {
      const code = runVueTransform(
        [
          '<script setup lang="ts">',
          "import { t } from 'yapyak';",
          '</script>',
          '<template>',
          `  <p>{{ t('Hello') }}</p>`,
          '</template>',
        ].join('\n'),
        ['en'],
      );
      expect(code).toContain('<p>Hello</p>');
      expect(code).not.toContain('{{');
    });

    it('elides Vue v-bind :aria-label="t(\'Save\')" to static aria-label="Save"', () => {
      const code = runVueTransform(
        [
          '<script setup lang="ts">',
          "import { t } from 'yapyak';",
          '</script>',
          '<template>',
          `  <button :aria-label="t('Save')">x</button>`,
          '</template>',
        ].join('\n'),
        ['en'],
      );
      expect(code).toContain('aria-label="Save"');
      expect(code).not.toContain(':aria-label');
    });

    it('elides Svelte mustache {t("Hello")} to bare Hello', () => {
      const code = runSvelteTransform(
        [
          '<script lang="ts">',
          "import { t } from 'yapyak';",
          '</script>',
          `<p>{t('Hello')}</p>`,
        ].join('\n'),
        ['en'],
      );
      expect(code).toContain('<p>Hello</p>');
    });

    it('elides Svelte attribute aria-label={t("Save")} to aria-label="Save"', () => {
      const code = runSvelteTransform(
        [
          '<script lang="ts">',
          "import { t } from 'yapyak';",
          '</script>',
          `<button aria-label={t('Save')}>x</button>`,
        ].join('\n'),
        ['en'],
      );
      expect(code).toContain('aria-label="Save"');
      expect(code).not.toContain('aria-label={');
    });

    it('elides Astro mustache {t("Hello")} to bare Hello', () => {
      const code = runAstroTransform(
        [
          '---',
          "import { t } from 'yapyak';",
          '---',
          `<p>{t('Hello')}</p>`,
        ].join('\n'),
        ['en'],
      );
      expect(code).toContain('<p>Hello</p>');
    });

    it('elides Astro attribute aria-label={t("Save")} to aria-label="Save"', () => {
      const code = runAstroTransform(
        [
          '---',
          "import { t } from 'yapyak';",
          '---',
          `<button aria-label={t('Save')}>x</button>`,
        ].join('\n'),
        ['en'],
      );
      expect(code).toContain('aria-label="Save"');
      expect(code).not.toContain('aria-label={');
    });

    it('emits quoted JSX text when source contains { or <', () => {
      const code = runTransform({
        locales: ['en'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t('Use <em> for emphasis')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain('{"Use <em> for emphasis"}');
    });

    it('emits expression-form JSX attribute when value contains "', () => {
      const code = runTransform({
        locales: ['en'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          '  return <button title={t(\'Say "hi"\')}>x</button>;',
          '}',
        ].join('\n'),
      });
      expect(code).toContain('title={"Say \\"hi\\""}');
    });

    it('keeps _pick wrappers in multi-locale without bare elision', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t('Hello')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain('{_pick(');
      expect(code).not.toContain('<p>Hello</p>');
    });
  });

  describe('source map', () => {
    it('returns a magic-string source map', () => {
      const fileId = 'test.ts';
      const source =
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n";
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
});
