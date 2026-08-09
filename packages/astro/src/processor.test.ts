import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler/internal';

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

describe('astro processor — shape', () => {
  it('returns a processor with the `astro` id', () => {
    expect(astro().id).toBe('astro');
  });

  it('refuses to declare a runtime — Astro uses full-reload for HMR', () => {
    expect(astro().runtime).toBeUndefined();
  });
});

describe('astro processor — extract', () => {
  it('returns call-site context for a template message', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<button>{t('Save changes')}</button>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages[0]?.locations[0]?.callSiteContext).toEqual({
      enclosingComponent: 'A',
      enclosingElement: 'button',
      snippet: `<button>{t('Save changes')}</button>`,
    });
  });

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

  it('extracts `t()` from inside a member-expression element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "import Button from './Button.astro';",
      '---',
      "<Button.Label>{t('Save')}</Button.Label>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from inside a `<>` fragment shorthand', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<>{t('Hello')}</>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a spread child expression', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<div>{...[t('Hello')]}</div>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from an element-valued attribute', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "import Button from './Button.astro';",
      '---',
      "<Button icon=<span>{t('Save')}</span> />",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from a fragment-valued attribute', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "import Button from './Button.astro';",
      '---',
      "<Button icon=<>{t('Save')}</> />",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from a mustache whose only child is a fragment', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<p>{<>{t('Hello')}</>}</p>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
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

  it('extracts every `t()` from a template with non-ASCII text', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<p>Världen</p><p>{t('Hello')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts every `t()` from a file with non-ASCII frontmatter', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "const heading = 'Världen';",
      '---',
      `<p>{t('Hello')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts `t()` from a template with an astral-plane character', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<p>🦬</p><p>{t('Hello')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((message) => message.source)).toEqual([
      'Hello',
    ]);
  });

  it('extracts every `t()` from a file with a BOM before the frontmatter', () => {
    const source = [
      '\uFEFF---',
      "import { t } from 'yapyak';",
      '---',
      `<p>{t('Hello')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();

    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts every `t()` from a file with a newline before the frontmatter', () => {
    const source = [
      '',
      '---',
      "import { t } from 'yapyak';",
      '---',
      `<p>{t('Hello')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();

    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts every `t()` from a file with whitespace before the frontmatter', () => {
    const source = [
      '  ---',
      "import { t } from 'yapyak';",
      '---',
      `<p>{t('Hello')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();

    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts every `t()` from a file with a space after the opening fence', () => {
    const source = [
      '--- ',
      "import { t } from 'yapyak';",
      '---',
      `<p>{t('Hello')}</p><p>{t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();

    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
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

  it('extracts every `t()` from a conditional with an element in the consequent', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      'const flag = true;',
      '---',
      `<p>{flag ? <b>{t('Hello')}</b> : t('Cancel')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();

    expect(sources).toEqual([
      'Cancel',
      'Hello',
    ]);
  });

  it('extracts every `t()` from a frontmatter JSX element', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      "const banner = <p>{t('Hello')}</p>;",
      '---',
      `<p>{t('Save')}</p>`,
    ].join('\n');
    const result = extractAstro(source);
    const sources = result.messages.map((message) => message.source).sort();

    expect(sources).toEqual([
      'Hello',
      'Save',
    ]);
  });

  it('records a diagnostic when the compiler cannot parse the template', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<p>{t('Hello')</p>",
    ].join('\n');
    const result = extractAstro(source);

    expect(result.diagnostics[0]?.code).toBe('YAP0048');
    expect(result.diagnostics[0]?.severity).toBe('error');
  });

  it('records a diagnostic range in string indices when non-ASCII text precedes the error', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<p>Världen {t('Hello')</p>",
    ].join('\n');
    const result = extractAstro(source);

    expect(result.diagnostics[0]?.range.start).toEqual({
      column: 24,
      line: 4,
      offset: 59,
    });
  });
});

describe('astro processor — already-compiled input fallback', () => {
  it('extracts `t()` calls from compiled-by-astro JS that is missing the `---` frontmatter delimiter', () => {
    const compiled = [
      "import { render as $$render, createComponent } from 'astro/runtime';",
      "import { t } from 'yapyak';",
      '',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "const $$Page = createComponent(($$result) => render`<p>${t('Hello')}</p>`);",
      'export default $$Page;',
    ].join('\n');
    const result = extractAstro(compiled);
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('rewrites `t()` calls in compiled-by-astro JS so the output runs at runtime', () => {
    const compiled = [
      "import { render as $$render, createComponent } from 'astro/runtime';",
      "import { t } from 'yapyak';",
      '',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "const $$Page = createComponent(($$result) => render`<p>${t('Hello')}</p>`);",
      'export default $$Page;',
    ].join('\n');
    const code = runAstroTransform(compiled);
    expect(code).not.toContain("t('Hello')");
  });

  it('writes the multi-locale import at the top when the source has no frontmatter', () => {
    const compiled = [
      "import { render as $$render, createComponent } from 'astro/runtime';",
      "import { t } from 'yapyak';",
      '',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "const $$Page = createComponent(($$result) => render`<p>${t('Hello')}</p>`);",
      'export default $$Page;',
    ].join('\n');
    const code = runAstroTransform(compiled, [
      'en',
      'sv',
    ]);
    expect(code).toMatch(/^import \{ pick as _pick \} from 'yapyak\/internal'/);
  });

  it('records no diagnostic for already-compiled input', () => {
    const result = extractAstro(
      [
        "import { t } from 'yapyak';",
        "const heading = t('Hello');",
      ].join('\n'),
    );

    expect(result.diagnostics).toHaveLength(0);
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

  it('replaces `t()` in place when the call shares its expression', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        'const x = 1;',
        '---',
        `<p>{t('Hello') + x}</p>`,
      ].join('\n'),
    );

    expect(code).toContain(`<p>{'Hello' + x}</p>`);
  });

  it('elides an expression whose only content is a parenthesized `t()`', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<p>{(t('Hello'))}</p>`,
      ].join('\n'),
    );

    expect(code).toContain('<p>Hello</p>');
  });

  it('rewrites every `t()` in a conditional with an element in the consequent', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        'const flag = true;',
        '---',
        `<p>{flag ? <b>{t('Hello')}</b> : t('Cancel')}</p>`,
      ].join('\n'),
      [
        'en',
        'sv',
      ],
    );

    expect(code).toContain(
      '<p>{flag ? <b>{_pick(_variants_$1)}</b> : _pick(_variants_$0)}</p>',
    );
  });

  it('preserves an element passed as a `t()` placeholder value', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<p>{t('Hi {name}', { name: <strong>Save</strong> })}</p>`,
      ].join('\n'),
    );

    // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
    expect(code).toContain('<p>{`Hi ${<strong>Save</strong>}`}</p>');
  });

  it('rewrites `t()` in a file with a BOM before the frontmatter', () => {
    const code = runAstroTransform(
      [
        '\uFEFF---',
        "import { t } from 'yapyak';",
        '---',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
      [
        'en',
        'sv',
      ],
    );

    expect(code).toContain(
      "---\nimport { pick as _pick } from 'yapyak/internal';",
    );
    expect(code).toContain('<p>{_pick(_variants_$0)}</p>');
  });

  it('rewrites `t()` in a frontmatter JSX element to a `_pick` call', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        "const banner = <p>{t('Hello')}</p>;",
        '---',
        '<Fragment>{banner}</Fragment>',
      ].join('\n'),
      [
        'en',
        'sv',
      ],
    );

    expect(code).toContain('const banner = <p>{_pick(_variants_$0)}</p>;');
  });

  it('rewrites `t()` in a file with a space after the closing fence', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        '--- ',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
      [
        'en',
        'sv',
      ],
    );

    expect(code).toContain('<p>{_pick(_variants_$0)}</p>');
  });
});
