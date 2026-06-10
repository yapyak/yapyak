import type { TransformFileRequest } from './transform';

import { describe, expect, it } from 'vitest';

import { toMessageId } from '../message-id';
import { extractFile } from './extract';
import { transformFile } from './transform';

function runTransform(input: {
  source: string;
  locales: string[];
  translations?: Record<string, Record<string, string>>;
  fileId?: string;
}): string {
  const fileId = input.fileId ?? 'src/a.tsx';
  const extracted = extractFile(fileId, input.source);
  const request: TransformFileRequest = {
    extracted,
    fileId,
    locales: input.locales,
    source: input.source,
    translations: input.translations ?? {},
  };
  return transformFile(request).code;
}

function hashId(source: string, context?: string): string {
  return toMessageId(source, context);
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
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
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
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
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
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
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

    it('escapes `{` and `}` in static catalog string variants so Vue/JSX parsers never see literal braces', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('Closing }} pattern with { open');",
      ].join('\n');
      const code = runTransform({ locales: ['en', 'sv'], source });
      expect(code).not.toMatch(/"[^"]*\}\}"/);
      expect(code).not.toMatch(/"[^"]*\{[a-z]/);
      expect(code).toContain('\\u007d\\u007d');
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
    it('preserves an inline `t.in(expr)` locale into `_pick`', () => {
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

    it('preserves a chained `t.in(...).as(...)` locale into `_pick`', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          export const x = t.in('sv').as('button', 'Save');
        `,
      });
      expect(code).toContain('_pick(');
      expect(code).toContain("{ locale: 'sv' }");
    });

    it('preserves a scoped locale alongside placeholder params into `_pick`', () => {
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

  describe('AST variants', () => {
    it('emits a string variant for a literal-only template', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: { sv: { [hashId('Hello')]: 'Hej' } },
      });
      expect(code).toContain("en: 'Hello'");
      expect(code).toContain("sv: 'Hej'");
      expect(code).not.toContain('_literal(');
    });

    it('emits builder-call AST for a template with a placeholder', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: `
          import { t } from 'yapyak';
          export function greet(name) {
            return t('Hi {name}', { name });
          }
        `,
      });
      expect(code).toContain('_literal("Hi ")');
      expect(code).toContain('_placeholder("name")');
      expect(code).toMatch(
        /import \{[^}]*literal as _literal[^}]*\} from 'yapyak\/internal'/,
      );
      expect(code).toMatch(
        /import \{[^}]*placeholder as _placeholder[^}]*\} from 'yapyak\/internal'/,
      );
    });

    it('emits _plural and _count for a plural template', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function items(count) {
            return t('{count, plural, one {# item} other {# items}}', { count });
          }
        `,
      });
      expect(code).toContain('_plural("count","cardinal"');
      expect(code).toContain('_count()');
      expect(code).toContain('_literal(" item")');
      expect(code).toMatch(
        /import \{[^}]*plural as _plural[^}]*\} from 'yapyak\/internal'/,
      );
      expect(code).toMatch(
        /import \{[^}]*count as _count[^}]*\} from 'yapyak\/internal'/,
      );
    });

    it('emits _number for a number template', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function show(value) {
            return t('{value, number, percent}', { value });
          }
        `,
      });
      expect(code).toContain('_number("value"');
      expect(code).toContain('"style":"percent"');
      expect(code).toMatch(
        /import \{[^}]*number as _number[^}]*\} from 'yapyak\/internal'/,
      );
    });

    it('emits _date for a date template', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function show(when) {
            return t('Updated {when, date, short}', { when });
          }
        `,
      });
      expect(code).toContain('_date("when","short")');
      expect(code).toMatch(
        /import \{[^}]*date as _date[^}]*\} from 'yapyak\/internal'/,
      );
    });

    it('does not import factories when no template needs them', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).not.toContain('_literal');
      expect(code).not.toContain('_placeholder');
    });

    it('combines pick + multiple factory imports in one statement', () => {
      const code = runTransform({
        locales: ['en'],
        source: `
          import { t } from 'yapyak';
          export function items(count) {
            return t('{count, plural, one {# item} other {# items}}', { count });
          }
        `,
      });
      expect(code).toMatch(
        /import \{ pick as _pick, literal as _literal, count as _count, plural as _plural \} from 'yapyak\/internal'/,
      );
    });
  });

  describe('with bare-string elision in templates', () => {
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
      const extracted = extractFile(fileId, source);
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

    it('emits sources from `sourcePath` when provided', () => {
      const fileId = 'src/a.ts';
      const sourcePath = '/abs/src/a.ts';
      const source =
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n";
      const extracted = extractFile(fileId, source);
      const result = transformFile({
        extracted,
        fileId,
        locales: ['en'],
        source,
        sourcePath,
        translations: {},
      });
      expect(result.map.sources).toEqual([sourcePath]);
    });
  });

  describe('`t.as()` rewrites', () => {
    it('transforms `t.as` to a bare literal in single-locale mode', () => {
      const code = runTransform({
        locales: ['en'],
        source:
          "import { t } from 'yapyak';\nexport const x = t.as('button', 'Save');\n",
      });
      expect(code).toContain("'Save'");
      expect(code).not.toContain('t.as(');
    });

    it('transforms `t.as` to `_pick` and looks up by the context-disambiguated message id', () => {
      const code = runTransform({
        locales: ['en', 'sv'],
        source:
          "import { t } from 'yapyak';\nexport const x = t.as('button', 'Save');\n",
        translations: { sv: { [hashId('Save', 'button')]: 'Spara' } },
      });
      expect(code).toContain('_pick(');
      expect(code).not.toContain('t.as(');
      expect(code).toContain('Spara');
    });

    it('writes params from the third arg of `t.as`', () => {
      const code = runTransform({
        locales: ['en'],
        source:
          "import { t } from 'yapyak';\nexport function x(name) {\n  return t.as('greeting', 'Hi {name}', { name });\n}\n",
      });
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      expect(code).toContain('`Hi ${name}`');
      expect(code).not.toContain('t.as(');
    });
  });
});
