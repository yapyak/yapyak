import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler';

import { astro } from './processor';

const processors = [astro()];

function runAstroTransform(source: string, locales: string[] = ['en']): string {
  const fileId = 'src/a.astro';
  const extracted = extractFile({ fileId, locales, processors, source });
  return transformFile({
    extracted,
    fileId,
    locales,
    processors,
    source,
    translations: {},
  }).code;
}

function extractAstro(source: string, locales: string[] = ['en']) {
  return extractFile({
    fileId: 'src/a.astro',
    locales,
    processors,
    source,
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
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('returns template `t()` calls when frontmatter imports yapyak', () => {
    const source = [
      '---',
      "import { t } from 'yapyak';",
      '---',
      "<p>{t('Hello')}</p>",
    ].join('\n');
    const result = extractAstro(source);
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('returns no messages when the frontmatter does not import yapyak', () => {
    const source = ['---', '---', "<p>{t('Hello')}</p>"].join('\n');
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
    expect(result.messages.map((m) => m.source)).toContain('Save');
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
    expect(result.messages.map((m) => m.source)).toContain('Save');
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
    expect(result.messages.map((m) => m.source)).toContain('Save');
  });
});

describe('astro processor — transform', () => {
  it('elides Astro mustache `{t("Hello")}` to bare `Hello`', () => {
    const code = runAstroTransform(
      ['---', "import { t } from 'yapyak';", '---', `<p>{t('Hello')}</p>`].join(
        '\n',
      ),
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
      ['---', "import { t } from 'yapyak';", '---', `<p>{t('Hello')}</p>`].join(
        '\n',
      ),
      ['en', 'sv'],
    );
    expect(code).toMatch(/import \{ pick as _pick \} from 'yapyak\/internal'/);
  });
});
