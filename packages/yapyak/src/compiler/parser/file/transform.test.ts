import type { Processor } from '../../../processor';
import type { TransformFileRequest } from './transform';

import { describe, expect, it } from 'vitest';

import { toMessageKey } from '../message-key';
import { extractFile } from './extract';
import { transformFile } from './transform';

function runTransform(input: {
  source: string;
  locales: string[];
  translations?: Record<string, Record<string, string>>;
  fileId?: string;
  processors?: Processor[];
}): string {
  const fileId = input.fileId ?? 'src/a.tsx';
  const extracted = extractFile(fileId, input.source, {
    processors: input.processors,
  });
  const request: TransformFileRequest = {
    extracted,
    fileId,
    locales: input.locales,
    processors: input.processors,
    source: input.source,
    translations: input.translations ?? {},
  };
  return transformFile(request).code;
}

function hashId(source: string, context?: string): string {
  return toMessageKey(source, context);
}

describe('transformFile', () => {
  describe('single-locale elision', () => {
    it('elides `t(literal)` to a plain string literal', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).toContain("'Hello'");
      expect(code).not.toContain("t('Hello')");
      expect(code).not.toContain('_pick');
    });

    it('elides `t` with simple placeholders to a template literal', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).not.toContain("from 'yapyak'");
    });

    it('clears the `t` import even when `t` appears inside a comment', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: `
          import { t } from 'yapyak';
          // t is the compiler entry point
          export const x = t('Hello');
        `,
      });
      expect(code).not.toContain("from 'yapyak'");
    });

    it('clears the `t` import even when `t` appears inside a string literal', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: `
          import { t } from 'yapyak';
          export const note = "t is the entry point";
          export const x = t('Hello');
        `,
      });
      expect(code).not.toContain("from 'yapyak'");
    });

    it('elides a repeated placeholder through a single-evaluation IIFE', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: `
          import { t } from 'yapyak';
          export function greet(name) {
            return t('{name} and {name}', { name });
          }
        `,
      });
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      expect(code).toContain('((_p0) => `${_p0} and ${_p0}`)(name)');
    });

    it('elides a repeated placeholder named `_name` without colliding with the IIFE parameter', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: `
          import { t } from 'yapyak';
          export function greet(_name) {
            return t('{a} and {a}', { a: _name });
          }
        `,
      });
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      expect(code).toContain('((_p0) => `${_p0} and ${_p0}`)(_name)');
    });

    it('preserves a sibling user variable named `_p0` when wrapping a repeated placeholder', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: `
          import { t } from 'yapyak';
          export function greet(_p0, x) {
            return t('{a} {a} {b}', { a: x, b: _p0 });
          }
        `,
      });
      expect(code).not.toMatch(/\(\(_p0\)\s*=>/);
      expect(code).toContain('_p0');
    });

    it('elides a single-use placeholder without an IIFE wrapper', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: `
          import { t } from 'yapyak';
          export function greet(name) {
            return t('Hi {name}', { name });
          }
        `,
      });
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      expect(code).toContain('`Hi ${name}`');
      expect(code).not.toContain('=>');
    });

    it('preserves `useLocale` specifier when still referenced', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
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
      const code = runTransform({
        locales: [
          'en',
        ],
        source,
      });
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
      const code = runTransform({
        locales: [
          'en',
        ],
        source,
      });
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
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source,
      });
      expect(code).toContain('type TParams');
      expect(code).toContain('_pick');
    });

    it('emits escaped `{` and `}` in static catalog string variants so Vue/JSX parsers never see literal braces', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('Closing }} pattern with { open');",
      ].join('\n');
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source,
      });
      expect(code).not.toMatch(/"[^"]*\}\}"/);
      expect(code).not.toMatch(/"[^"]*\{[a-z]/);
      expect(code).toContain('\\u007d\\u007d');
      expect(code).toContain('\\u007b');
    });

    it('preserves a placeholder when its `{` is immediately preceded by `$`', () => {
      const source = [
        "import { t } from 'yapyak';",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
        "export const x = t('${amount}', { amount: 5 });",
      ].join('\n');
      const code = runTransform({
        locales: [
          'en',
        ],
        source,
      });
      expect(code).toContain('`$${5}`');
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      expect(code).not.toContain('\\${amount}');
    });

    it('transforms `{` and `}` in elided single-locale literal without placeholders', () => {
      const source = [
        "import { t } from 'yapyak';",
        "export const x = t('Closing braces inside: }}');",
      ].join('\n');
      const code = runTransform({
        locales: [
          'en',
        ],
        source,
      });
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
      const code = runTransform({
        locales: [
          'en',
        ],
        source,
      });
      expect(code).toContain("import { useLocale } from '@yapyak/react';");
      expect(code).toContain("import { anthropic } from '@yapyak/anthropic';");
    });
  });

  describe('with locale scoping', () => {
    it('preserves an inline `t.in(expr)` locale into `_pick`', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
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
        locales: [
          'en',
          'sv',
        ],
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
        locales: [
          'en',
          'sv',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
          'sv',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: {
          sv: {
            [hashId('Hello')]: 'Hej',
          },
        },
      });
      expect(code).toContain('_pick(');
      expect(code).toContain("en: 'Hello'");
      expect(code).toContain("sv: 'Hej'");
    });

    it('emits source as fallback when a translation is missing', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: {},
      });
      expect(code).toContain("sv: 'Hello'");
    });

    it('preserves original params object as 2nd arg', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
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
        locales: [
          'en',
          'sv',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).toMatch(
        /import \{ pick as _pick \} from 'yapyak\/internal'/,
      );
      expect(code).not.toMatch(/import \{ _pick.*\t.*\} from 'yapyak'/);
    });

    it('transforms local alias when user already has `_pick`', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
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
      expect(code).toMatch(/_pick_\$0\(_yapyak_catalog/);
      expect(code).toContain('const _pick = "user-defined";');
    });

    it('transforms alias further when both `_pick` and `_pick_$0` are taken', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
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
      expect(code).toMatch(/_pick_\$1\(_yapyak_catalog/);
    });

    it('emits a hoisted module-scope catalog for a multi-locale call', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Save');\n",
      });
      expect(code).toMatch(/const _yapyak_catalog_\$0 = \{/);
      expect(code).toContain('_pick(_yapyak_catalog_$0');
    });

    it('folds two call sites with identical catalog text to one declaration', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: [
          "import { t } from 'yapyak';",
          "export const a = t('Save');",
          "export const b = t('Save');",
        ].join('\n'),
      });
      const declarations = code.match(/_yapyak_catalog_\$\d+ = /g) ?? [];
      expect(declarations).toHaveLength(1);
      const calls = code.match(/_pick\(_yapyak_catalog_\$\d+/g) ?? [];
      expect(calls).toHaveLength(2);
    });

    it('emits one catalog per distinct source string', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: [
          "import { t } from 'yapyak';",
          "export const a = t('Save');",
          "export const b = t('Cancel');",
        ].join('\n'),
      });
      const declarations = code.match(/_yapyak_catalog_\$\d+ = /g) ?? [];
      expect(declarations).toHaveLength(2);
    });

    it('preserves a free catalog prefix when user already has `_yapyak_catalog`', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: [
          "import { t } from 'yapyak';",
          'const _yapyak_catalog = "user-defined";',
          "export const x = t('Hello');",
          'export { _yapyak_catalog };',
        ].join('\n'),
      });
      expect(code).toMatch(/_yapyak_catalog_\$0_\$0 = \{/);
      expect(code).toContain('const _yapyak_catalog = "user-defined";');
    });

    it('preserves a free catalog prefix when user has both `_yapyak_catalog` and `_yapyak_catalog_$0`', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: [
          "import { t } from 'yapyak';",
          'const _yapyak_catalog = "user-defined";',
          'const _yapyak_catalog_$0 = "also-user-defined";',
          "export const x = t('Hello');",
          'export { _yapyak_catalog, _yapyak_catalog_$0 };',
        ].join('\n'),
      });
      expect(code).toMatch(/_yapyak_catalog_\$1_\$0 = \{/);
      expect(code).toContain('const _yapyak_catalog = "user-defined";');
      expect(code).toContain('const _yapyak_catalog_$0 = "also-user-defined";');
    });

    it('preserves `_yapyak_catalog` when the prefix appears only as a substring of a larger identifier', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: [
          "import { t } from 'yapyak';",
          'const my_yapyak_catalog_other = "looks-similar";',
          'const your_yapyak_catalog_thing = "looks-similar-too";',
          "export const x = t('Hello');",
          'export { my_yapyak_catalog_other, your_yapyak_catalog_thing };',
        ].join('\n'),
      });
      expect(code).toMatch(/const _yapyak_catalog_\$0 = \{/);
      expect(code).toContain('const my_yapyak_catalog_other');
      expect(code).toContain('const your_yapyak_catalog_thing');
    });
  });

  describe('AST variants', () => {
    it('emits a string variant for a literal-only template', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
        translations: {
          sv: {
            [hashId('Hello')]: 'Hej',
          },
        },
      });
      expect(code).toContain("en: 'Hello'");
      expect(code).toContain("sv: 'Hej'");
      expect(code).not.toContain('_literal(');
    });

    it('emits builder-call AST for a template with a placeholder', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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

    it('clears the factory imports when no template needs them', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source: "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      });
      expect(code).not.toContain('_literal');
      expect(code).not.toContain('_placeholder');
    });

    it('folds pick and multiple factory imports into one statement', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t('Use <em> for emphasis')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain("{'Use <em> for emphasis'}");
    });

    it('refuses bare JSX elision when the source has leading or trailing whitespace', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t(' Hello ')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain("{' Hello '}");
      expect(code).not.toContain('<p> Hello </p>');
    });

    it('refuses bare JSX elision when the source has a line break', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source: [
          "import { t } from 'yapyak';",
          'export function App() {',
          "  return <p>{t('Line one\\nLine two')}</p>;",
          '}',
        ].join('\n'),
      });
      expect(code).toContain("{'Line one\\nLine two'}");
    });

    it('emits expression-form JSX attribute when value contains `"`', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
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
        locales: [
          'en',
          'sv',
        ],
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
        locales: [
          'en',
        ],
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
        locales: [
          'en',
        ],
        source,
        sourcePath,
        translations: {},
      });
      expect(result.map.sources).toEqual([
        sourcePath,
      ]);
    });
  });

  describe('`t.as()` rewrites', () => {
    it('transforms `t.as` to a bare literal in single-locale mode', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t.as('button', 'Save');\n",
      });
      expect(code).toContain("'Save'");
      expect(code).not.toContain('t.as(');
    });

    it('transforms `t.as` to `_pick` and looks up by the context-disambiguated message id', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t.as('button', 'Save');\n",
        translations: {
          sv: {
            [hashId('Save', 'button')]: 'Spara',
          },
        },
      });
      expect(code).toContain('_pick(');
      expect(code).not.toContain('t.as(');
      expect(code).toContain('Spara');
    });

    it('writes params from the third arg of `t.as`', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport function x(name) {\n  return t.as('greeting', 'Hi {name}', { name });\n}\n",
      });
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      expect(code).toContain('`Hi ${name}`');
      expect(code).not.toContain('t.as(');
    });
  });

  describe('with nested `t()` calls', () => {
    it('transforms a nested `t()` inside an outer params expression', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t('Outer {x}', { x: t('Inner') });\n",
      });
      expect(code).toContain('_pick(_yapyak_catalog_$1');
      expect(code).toContain('x: _pick(_yapyak_catalog_$0)');
      expect(code).not.toContain("t('Outer");
      expect(code).not.toContain("t('Inner'");
    });

    it('blocks single-locale elision when a nested `t()` lives inside the params expression', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t('Outer {x}', { x: t('Inner') });\n",
      });
      expect(code).not.toContain("t('Outer");
      expect(code).not.toContain("t('Inner'");
    });

    it('transforms a deeply nested chain of three `t()` calls', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t('A {a}', { a: t('B {b}', { b: t('C') }) });\n",
      });
      expect(code).toContain(
        '_pick(_yapyak_catalog_$2, { a: _pick(_yapyak_catalog_$1, { b: _pick(_yapyak_catalog_$0) }) })',
      );
    });

    it('transforms two sibling nested `t()` calls inside a single outer params expression', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t('A {a} {b}', { a: t('Hello'), b: t('Save') });\n",
      });
      expect(code).toContain('a: _pick(_yapyak_catalog_$0)');
      expect(code).toContain('b: _pick(_yapyak_catalog_$1)');
    });

    it('transforms two non-nested sibling `t()` calls independently', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nexport const x = t('Hello') + t('Save');\n",
      });
      expect(code).toContain(
        '_pick(_yapyak_catalog_$0) + _pick(_yapyak_catalog_$1)',
      );
    });
  });

  describe('with local shadowing', () => {
    it('preserves a function whose parameter named `t` shadows the import', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport function render(t) { return t('Hello'); }\n",
      });
      expect(code).toContain("return t('Hello')");
      expect(code).not.toContain('_pick');
    });

    it('preserves an arrow whose parameter named `t` shadows the import', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport const render = (t) => t('Hello');\n",
      });
      expect(code).toContain("t('Hello')");
      expect(code).not.toContain('_pick');
    });

    it('preserves a catch-clause body whose binding named `t` shadows the import', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport function render() { try { return ''; } catch (t) { return t('Hello'); } }\n",
      });
      expect(code).toContain("t('Hello')");
      expect(code).not.toContain('_pick');
    });

    it('transforms a `t()` call outside any shadowing scope', () => {
      const code = runTransform({
        locales: [
          'en',
        ],
        source:
          "import { t } from 'yapyak';\nexport function render(t) { return t('Hello'); }\nexport const greeting = t('Hello');\n",
      });
      expect(code).toContain("return t('Hello')");
      expect(code).toContain("export const greeting = 'Hello'");
    });
  });

  describe('with framework fragments offset', () => {
    const offsetProcessor: Processor = {
      applyImport: (magicString, _source, importStatement) => {
        magicString.appendLeft(0, `${importStatement}\n`);
      },
      extensions: [
        '.pad',
      ],
      id: 'pad',
      parseFragments: (source) => {
        const prefix = '<padding>\n';
        if (!source.startsWith(prefix)) {
          return [
            {
              code: source,
              kind: 'script',
              lang: 'ts',
              originalOffset: 0,
            },
          ];
        }
        return [
          {
            code: source.slice(prefix.length),
            kind: 'script',
            lang: 'ts',
            originalOffset: prefix.length,
          },
        ];
      },
    };

    it('transforms a nested `t.in()` inside a fragment with a non-zero offset', () => {
      const inner = "t.in('en', 'World')";
      const outer = `t('Hi {name}', { name: ${inner} })`;
      const code = runTransform({
        fileId: 'src/a.pad',
        locales: [
          'en',
          'sv',
        ],
        processors: [
          offsetProcessor,
        ],
        source: `<padding>\nimport { t } from 'yapyak';\nexport const x = ${outer};\n`,
        translations: {
          sv: {
            'Hi {name}': 'Hej {name}',
            World: 'Världen',
          },
        },
      });
      expect(code).toContain('_pick(_yapyak_catalog');
      expect(code).not.toContain("t.in('en', 'World')");
    });
  });

  describe('with factory-name collisions', () => {
    it('emits a renamed factory import when the source already declares `_literal`', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nconst _literal = 'taken';\nexport const x = t('Hi {name}', { name: 'A' });\n",
        translations: {
          sv: {
            'Hi {name}': 'Hej {name}',
          },
        },
      });
      expect(code).toMatch(/literal as _literal_\$0/);
      expect(code).not.toMatch(/literal as _literal[^_]/);
    });

    it('emits a renamed factory import when the source already declares `_date`', () => {
      const code = runTransform({
        locales: [
          'en',
          'sv',
        ],
        source:
          "import { t } from 'yapyak';\nconst _date = new Date();\nexport const x = t('At: {when, date, short}', { when: _date });\n",
        translations: {
          sv: {
            'At: {when, date, short}': 'Vid: {when, date, short}',
          },
        },
      });
      expect(code).toMatch(/date as _date_\$0/);
    });
  });
});
