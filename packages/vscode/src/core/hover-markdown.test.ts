import { describe, expect, it } from 'vitest';

import { buildHoverMarkdown, buildLocaleHoverMarkdown } from './hover-markdown';

const PROJECT = {
  fileId: 'src/a.tsx',
  localesDir: 'locales',
  root: '/project',
  source: 'Save changes',
};

function buildOpenSourceLink(): string {
  return `command:yapyak.openSource?${encodeURIComponent(
    JSON.stringify({
      fileId: 'src/a.tsx',
      root: '/project',
      source: 'Save changes',
    }),
  )}`;
}

function buildRetranslateLink(locale: string, translated: boolean): string {
  return `command:yapyak.retranslate?${encodeURIComponent(
    JSON.stringify({
      fileId: 'src/a.tsx',
      locale,
      root: '/project',
      source: 'Save changes',
      translated,
    }),
  )}`;
}

function buildOpenTranslationLink(locale: string): string {
  return `command:yapyak.openTranslation?${encodeURIComponent(
    JSON.stringify({
      fileId: 'src/a.tsx',
      locale,
      localesDir: 'locales',
      root: '/project',
      source: 'Save changes',
    }),
  )}`;
}

describe('buildHoverMarkdown', () => {
  it('builds a row with an open link for every locale', () => {
    expect(
      buildHoverMarkdown({
        ...PROJECT,
        rows: [
          {
            locale: 'de',
          },
          {
            locale: 'sv',
            value: 'Spara ändringar',
          },
        ],
      }),
    ).toBe(
      `**Save changes**\n\n\`de\` _untranslated_ · [$(go-to-file)](${buildOpenTranslationLink('de')} "Go to de.json")  \n\`sv\` Spara ändringar · [$(go-to-file)](${buildOpenTranslationLink('sv')} "Go to sv.json")`,
    );
  });

  it('builds a header holding the homonym context', () => {
    expect(
      buildHoverMarkdown({
        ...PROJECT,
        context: 'button',
        rows: [],
        source: 'Open',
      }),
    ).toBe('**Open** · `button`');
  });

  it('builds only the header for an empty rows array', () => {
    expect(
      buildHoverMarkdown({
        ...PROJECT,
        rows: [],
      }),
    ).toBe('**Save changes**');
  });
});

describe('buildLocaleHoverMarkdown', () => {
  it('builds hover markdown holding the other locales', () => {
    expect(
      buildLocaleHoverMarkdown({
        ...PROJECT,
        locale: 'sv',
        rows: [
          {
            locale: 'de',
            value: 'Änderungen speichern',
          },
          {
            locale: 'fi',
          },
          {
            locale: 'sv',
            value: 'Spara ändringar',
          },
        ],
        translator: true,
        value: 'Spara ändringar',
      }),
    ).toBe(
      `**Save changes**\n\n\`de\` Änderungen speichern  \n\`fi\` _untranslated_\n\n[$(go-to-file) Go to source](${buildOpenSourceLink()})  \n[$(refresh) Retranslate](${buildRetranslateLink('sv', true)})\n\n_src/a.tsx_`,
    );
  });

  it('builds a translate link when the translation is empty', () => {
    expect(
      buildLocaleHoverMarkdown({
        ...PROJECT,
        locale: 'sv',
        rows: [],
        translator: true,
        value: '',
      }),
    ).toBe(
      `**Save changes**\n\n[$(go-to-file) Go to source](${buildOpenSourceLink()})  \n[$(sparkle) Translate](${buildRetranslateLink('sv', false)})\n\n_src/a.tsx_`,
    );
  });

  it('builds a header and links holding the homonym context', () => {
    const markdown = buildLocaleHoverMarkdown({
      ...PROJECT,
      context: 'button',
      locale: 'sv',
      rows: [],
      source: 'Open',
      translator: true,
      value: 'Öppna',
    });

    expect(markdown).toMatch(/^\*\*Open\*\* · `button`/);
    expect(markdown).toContain(encodeURIComponent('"context":"button"'));
  });

  it('builds no translate link without a translator', () => {
    expect(
      buildLocaleHoverMarkdown({
        ...PROJECT,
        locale: 'sv',
        rows: [],
        translator: false,
        value: 'Spara ändringar',
      }),
    ).toBe(
      `**Save changes**\n\n[$(go-to-file) Go to source](${buildOpenSourceLink()})\n\n_src/a.tsx_`,
    );
  });
});
