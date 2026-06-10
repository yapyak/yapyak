import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler';

import { astro } from './processor';

const processors = [
  astro(),
];

function runAstroTransform(
  source: string,
  locales: string[] = [
    'en',
  ],
): string {
  const fileId = 'src/a.astro';
  const extracted = extractFile(fileId, source, {
    processors,
  });
  return transformFile({
    extracted,
    fileId,
    locales,
    processors,
    source,
    translations: {},
  }).code;
}

function extractAstro(source: string) {
  return extractFile('src/a.astro', source, {
    processors,
  });
}

describe('astro processor — extract', () => {
  it('returns frontmatter `t()` calls when frontmatter imports yapyak', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "const heading = t('Hello');",
      '---',
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('returns template `t()` calls when frontmatter imports yapyak', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<p>{t('Hello')}</p>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('returns no messages when the frontmatter does not import yapyak', () => {
    const source = [
      '---',
      '---',
      "<p>{t('Hello')}</p>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages).toHaveLength(0);
  });

  it('returns no messages when there is no frontmatter at all', () => {
    const result = extractAstro("<p>{t('Hello')}</p>");
    expect(result.messages).toHaveLength(0);
  });

  it('extracts `t()` from an expression attribute', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<button title={t('Save')}>x</button>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from a shorthand attribute expression', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "const title = t('Save');",
      '---',
      '<button {title}>x</button>',
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from a spread attribute expression', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "const props = { title: t('Save') };",
      '---',
      '<button {...props}>x</button>',
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from a deeply nested element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<section><div><p><span>{t('Hello')}</span></p></div></section>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from inside a `<Fragment>` element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<Fragment>{t('Hello')}</Fragment>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from inside a `<Component>` element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "import Button from './Button.astro';",
      '---',
      "<Button>{t('Save')}</Button>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from inside a `<custom-element>`', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<my-button>{t('Save')}</my-button>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` only from an expression attribute beside a quoted attribute', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<button title="static" aria-label={t('Save')}>x</button>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toEqual([
      'Save',
    ]);
  });

  it('extracts `t()` from an expression attribute beside a boolean attribute', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<button disabled aria-label={t('Save')}>x</button>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toEqual([
      'Save',
    ]);
  });

  it('extracts every `t()` from a template with multiple expressions', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<p>{t('Hello')}</p><p>{t('World')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Cancel',
      'Hello',
      'World',
    ]);
  });

  it('extracts `t()` from a frontmatter that spans multiple lines', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '',
      '// a comment',
      "const heading = t('Hello');",
      "const action = t('Save');",
      '',
      '---',
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Hello',
      'Save',
    ]);
  });

  it('extracts `t()` from siblings under the same element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<div>{t('Hello')}<span>middle</span>{t('Cancel')}</div>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts `t()` from an expression that contains a nested element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      'const flag = true;',
      '---',
      `<div>{flag && <span>{t('Hello')}</span>}</div>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a mustache with leading and trailing whitespace', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<p>{ t('Hello') }</p>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('returns no messages from an empty mustache `{}`', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      '<p>{}</p>',
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages).toHaveLength(0);
  });

  it('extracts `t()` from a mustache that follows static text in the same parent', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<p>prefix {t('Hello')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('returns no messages from a mustache whose only child is an element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      '<p>{<span>x</span>}</p>',
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages).toHaveLength(0);
  });

  it('extracts `t()` from a mustache whose body holds nested object braces', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<p>{ ({ key: t('Hello') }).key }</p>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a self-closing element attribute', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<img alt={t('Settings')} src="/x.png" />`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain(
      'Settings',
    );
  });
});

describe('astro processor — transform', () => {
  it('elides Astro mustache `{t("Hello")}` to bare `Hello`', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
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
    );
    expect(code).toContain('aria-label="Save"');
    expect(code).not.toContain('aria-label={');
  });

  it('writes the multi-locale source verbatim into the frontmatter import', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
      [
        'en',
        'sv',
      ],
    );
    expect(code).toMatch(/import \{ pick as _pick \} from 'yapyak\/internal'/);
  });
});
