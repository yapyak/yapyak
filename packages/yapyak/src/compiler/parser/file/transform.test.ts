import type { Processor } from '../../../processor';
import type { TransformFileRequest } from './transform';

import { astro } from '@yapyak/astro/processor';
import { svelte } from '@yapyak/svelte/processor';
import { vue } from '@yapyak/vue/processor';
import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { transformFile } from './transform';
import { createHash } from 'node:crypto';

const processors: Processor[] = [vue(), svelte(), astro()];

function runTransform(input: {
  source: string;
  locales: readonly string[];
  translations?: Record<string, Record<string, string>>;
  fileId?: string;
}): string {
  const fileId = input.fileId ?? 'src/a.tsx';
  const extracted = extractFile({
    fileId,
    locales: input.locales,
    processors,
    source: input.source,
  });
  const request: TransformFileRequest = {
    extracted,
    fileId,
    locales: input.locales,
    processors,
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
    it('elides `t(literal)` to a plain string literal', () => {
      const code = runTransform({
        locales: ['en'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).toContain("'Hello'");
      expect(code).not.toContain("t('Hello')");
      expect(code).not.toContain('_pick');
    });

    it('elides `t` with simple placeholders to a template literal', () => {
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

    it('emits `_pick` when source contains plurals', () => {
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

    it('clears the entire `t` import when no references remain', () => {
      const code = runTransform({
        locales: ['en'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).not.toContain("from 'yapyak'");
    });

    it('preserves `useLocale` specifier when still referenced', () => {
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

    it('preserves type-only `@yapyak/*` imports', () => {
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

    it('preserves inline type marker on `@yapyak/*` import specifier', () => {
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

    it('preserves type marker when injecting `_pick` into a mixed import', () => {
      const source = [
        "import { type TParams, t } from 'yapyak';",
        "export function greet(params: TParams<'Hi {name}'>) {",
        "  return t.in('sv', 'Hi {name}', params);",
        '}',
      ].join('\n');
      const code = runTransform({ locales: ['en', 'sv'], source });
      expect(code).toContain('type TParams');
      expect(code).toContain('_pick');
    });

    it('transforms `{` and `}` in catalog strings so Vue/JSX parsers never see literal braces', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('You have {count, plural, one {# item} other {# items}}', { count: 1 });",
      ].join('\n');
      const code = runTransform({ locales: ['en', 'sv'], source });
      expect(code).not.toMatch(/"[^"]*\}\}"/);
      expect(code).not.toMatch(/"[^"]*\{[a-z]/);
      expect(code).toContain('\\u007d');
      expect(code).toContain('\\u007b');
    });

    it('transforms `{` and `}` in elided single-locale literal without placeholders', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('Closing braces inside: }}');",
      ].join('\n');
      const code = runTransform({ locales: ['en'], source });
      expect(code).not.toMatch(/"[^"]*\}\}"/);
      expect(code).toContain('\\u007d\\u007d');
    });

    it('preserves imports from other `@yapyak/*` packages', () => {
      const source = [
        "import { useLocale } from '@yapyak/react';",
        "import { anthropic } from '@yapyak/anthropic';",
        "import { t } from 'yapyak';",
        'export function Greeting() {',
        '  void useLocale;',
        '  void anthropic;',
        "  return t('Hello');",
        '}',
      ].join('\n');
      const code = runTransform({ locales: ['en'], source });
      expect(code).toContain("import { useLocale } from '@yapyak/react';");
      expect(code).toContain("import { anthropic } from '@yapyak/anthropic';");
    });
  });

  describe('with locale scoping', () => {
    it('threads an inline `t.in(expr)` locale into `_pick`', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          declare const previewLocale: { value: string };
          export const x = t.in(previewLocale.value, 'Hello');
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('{ locale: previewLocale.value }');
    });

    it('threads a chained `t.in(...).at(...)` locale into `_pick`', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          export const x = t.in('sv').at('button', 'Open');
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain("{ locale: 'sv' }");
    });

    it('threads a scoped locale alongside placeholder params into `_pick`', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          export function greet(name) {
            return t.in('sv', 'Hi {name}', { name });
          }
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain('{ name }');
      expect(code).toContain("{ locale: 'sv' }");
    });

    it('blocks single-locale elision when a locale is scoped', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export const x = t.in('sv', 'Hello');
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain("{ locale: 'sv' }");
    });
  });

  describe('multi-locale', () => {
    it('emits `_pick` with catalog for `t`', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: { sv: { [hashId('Hello')]: 'Hej' } },
      });
      expect(code).toContain('_pick(');
      expect(code).toContain("en: 'Hello'");
      expect(code).toContain("sv: 'Hej'");
    });

    it('emits source as fallback when a translation is missing', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: {},
      });
      expect(code).toContain("sv: 'Hello'");
    });

    it('preserves original params object as 2nd arg', () => {
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

    it('emits `_pick` from `yapyak/internal` as a separate import', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).toMatch(
        /import \{ pick as _pick \} from 'yapyak\/internal'/,
      );
      expect(code).not.toMatch(/import \{ _pick.*\t.*\} from 'yapyak'/);
    });

    it('transforms local alias when user already has `_pick`', () => {
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

    it('transforms alias further when both `_pick` and `_pick_$0` are taken', () => {
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
      const fileId = 'src/a.vue';
      const extracted = extractFile({
        fileId,
        locales: input.locales,
        processors,
        source: input.source,
      });
      const result = transformFile({
        extracted,
        fileId,
        locales: input.locales,
        processors,
        source: input.source,
        translations: input.translations ?? {},
      });
      return result.code;
    }

    it('elides `t` in `<script setup>` and `<template>` for single-locale', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const heading = t('Hello');",
        '</script>',
        '<template>',
        `  <h1>{{ t('Hello') }}</h1>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en'], source });
      expect(code).toContain("'Hello'");
      expect(code).toContain('<h1>Hello</h1>');
      expect(code).not.toContain("t('Hello')");
      expect(code).not.toContain("t('Hello')");
      expect(code).not.toContain("from 'yapyak'");
    });

    it('emits `_pick` for multi-locale in template and script', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const heading = t('Hello');",
        '</script>',
        '<template>',
        `  <h1>{{ t('Hello') }}</h1>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({
        locales: ['en', 'sv'],
        source,
        translations: { sv: {} },
      });
      expect(code).toContain("_pick({ en: 'Hello', sv: 'Hello' })");
      expect(code).toContain("_pick({ en: 'Hello', sv: 'Hello' })");
      expect(code).toMatch(
        /import \{ pick as _pick \} from 'yapyak\/internal'/,
      );
    });

    it('transforms `:foo="..."` attribute expression', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <button :aria-label="t('Save changes')">Save</button>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en'], source });
      expect(code).toContain('aria-label="Save changes"');
      expect(code).not.toContain("t('Save changes')");
    });

    it('transforms `@click` event handler expression', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <button @click="alert(t('Hi'))">x</button>`,
        '</template>',
      ].join('\n');
      const code = runVueTransform({ locales: ['en'], source });
      expect(code).toContain("alert('Hi')");
    });

    it('preserves `<script setup>` when there is no core `t` import', () => {
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

    it('writes `_pick` into `<script setup>` in multi-locale even when only template uses `t`', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <h1>{{ t('Hello') }}</h1>`,
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
      const fileId = 'src/a.vue';
      const extracted = extractFile({ fileId, locales, processors, source });
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
      const fileId = 'src/a.svelte';
      const extracted = extractFile({ fileId, locales, processors, source });
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
      const fileId = 'src/a.astro';
      const extracted = extractFile({ fileId, locales, processors, source });
      return transformFile({
        extracted,
        fileId,
        locales,
        source,
        translations: {},
      }).code;
    }

    it('elides JSX text `<p>{t("Hello")}</p>` to `<p>Hello</p>`', () => {
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

    it('elides JSX attribute `aria-label={t("Save")}` to `aria-label="Save"`', () => {
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

    it('elides Vue mustache `{{ t("Hello") }}` to bare `Hello`', () => {
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

    it('elides Vue v-bind `:aria-label="t(\'Save\')"` to static `aria-label="Save"`', () => {
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

    it('elides Svelte mustache `{t("Hello")}` to bare `Hello`', () => {
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

    it('elides Svelte attribute `aria-label={t("Save")}` to `aria-label="Save"`', () => {
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

    it('elides Astro mustache `{t("Hello")}` to bare `Hello`', () => {
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

    it('elides Astro attribute `aria-label={t("Save")}` to `aria-label="Save"`', () => {
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

    it('emits quoted JSX text when source contains `{` or `<`', () => {
      const code = runTransform({
        locales: ['en'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t('Use <em> for emphasis')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain("{'Use <em> for emphasis'}");
    });

    it('emits expression-form JSX attribute when value contains `"`', () => {
      const code = runTransform({
        locales: ['en'],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          '  return <button title={t(\'Say "hi"\')}>x</button>;',
          '}',
        ].join('\n'),
      });
      expect(code).toContain("title={'Say \\u0022hi\\u0022'}");
    });

    it('preserves `_pick` wrappers in multi-locale without bare elision', () => {
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
    it('returns a `magic-string` source map', () => {
      const fileId = 'src/a.ts';
      const source =
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n";
      const extracted = extractFile({ fileId, locales: ['en'], processors, source });
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

  describe('`t.at()` rewrites', () => {
    it('strips `t.at` to a bare literal in single-locale mode', () => {
      const code = runTransform({
        locales: ['en'],
        source:
          "import { t } from 'yapyak';\nexport const x = t.at('button', 'Open');\n",
      });
      expect(code).toContain("'Open'");
      expect(code).not.toContain('t.at(');
    });

    it('rewrites `t.at` to `_pick` and looks up by the context-disambiguated message id', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source:
          "import { t } from 'yapyak';\nexport const x = t.at('button', 'Open');\n",
        translations: { sv: { [hashId('Open button')]: 'Öppna' } },
      });
      expect(code).toContain('_pick(');
      expect(code).not.toContain('t.at(');
      expect(code).toContain('Öppna');
    });

    it('forwards params from the third arg of `t.at`', () => {
      const code = runTransform({
        locales: ['en'],
        source:
          "import { t } from 'yapyak';\nexport function x(name) {\n  return t.at('greeting', 'Hi {name}', { name });\n}\n",
      });
      expect(code).toContain('`Hi ${name}`');
      expect(code).not.toContain('t.at(');
    });
  });
});
