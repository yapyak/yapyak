import type { Block } from './block';

import { describe, expect, it } from 'vitest';

import { blocksToMarkdown } from './markdown';

function paragraph(text: string): Block {
  return {
    children: [
      {
        kind: 'text',
        value: text,
      },
    ],
    kind: 'paragraph',
  };
}

describe('blocksToMarkdown', () => {
  it('returns an empty string for no blocks', () => {
    expect(blocksToMarkdown([])).toBe('');
  });

  it('renders a heading', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            {
              kind: 'text',
              value: 'Installation',
            },
          ],
          id: 'installation',
          kind: 'heading',
          level: 1,
        },
      ]),
    ).toBe('# Installation');
  });

  it('renders heading levels 1-6', () => {
    for (let level = 1; level <= 6; level++) {
      const result = blocksToMarkdown([
        {
          children: [
            {
              kind: 'text',
              value: 'H',
            },
          ],
          id: 'h',
          kind: 'heading',
          level: level as 1 | 2 | 3 | 4 | 5 | 6,
        },
      ]);
      expect(result).toBe(`${'#'.repeat(level)} H`);
    }
  });

  it('renders a paragraph', () => {
    expect(
      blocksToMarkdown([
        paragraph('Hello.'),
      ]),
    ).toBe('Hello.');
  });

  it('separates blocks with a blank line', () => {
    expect(
      blocksToMarkdown([
        paragraph('One.'),
        paragraph('Two.'),
      ]),
    ).toBe('One.\n\nTwo.');
  });

  it('renders strong and emphasis', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            {
              kind: 'text',
              value: 'mix ',
            },
            {
              children: [
                {
                  kind: 'text',
                  value: 'bold',
                },
              ],
              kind: 'strong',
            },
            {
              kind: 'text',
              value: ' and ',
            },
            {
              children: [
                {
                  kind: 'text',
                  value: 'em',
                },
              ],
              kind: 'emphasis',
            },
          ],
          kind: 'paragraph',
        },
      ]),
    ).toBe('mix **bold** and *em*');
  });

  it('renders inline code', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            {
              kind: 'inline-code',
              value: "t('Save')",
            },
          ],
          kind: 'paragraph',
        },
      ]),
    ).toBe("`t('Save')`");
  });

  it('renders a link', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            {
              children: [
                {
                  kind: 'text',
                  value: 'Docs',
                },
              ],
              href: 'https://yapyak.dev',
              kind: 'link',
              linkKind: 'external',
            },
          ],
          kind: 'paragraph',
        },
      ]),
    ).toBe('[Docs](https://yapyak.dev)');
  });

  it('renders an unordered list', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            {
              children: [
                paragraph('first'),
              ],
              kind: 'list-item',
            },
            {
              children: [
                paragraph('second'),
              ],
              kind: 'list-item',
            },
          ],
          kind: 'list',
          ordered: false,
        },
      ]),
    ).toBe('- first\n- second');
  });

  it('renders an ordered list', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            {
              children: [
                paragraph('one'),
              ],
              kind: 'list-item',
            },
            {
              children: [
                paragraph('two'),
              ],
              kind: 'list-item',
            },
          ],
          kind: 'list',
          ordered: true,
        },
      ]),
    ).toBe('1. one\n2. two');
  });

  it('renders a code block with language', () => {
    expect(
      blocksToMarkdown([
        {
          kind: 'code-block',
          label: null,
          language: 'ts',
          path: null,
          source: "import { t } from 'yapyak';",
        },
      ]),
    ).toBe("```ts\nimport { t } from 'yapyak';\n```");
  });

  it('renders a code block with path in fence info', () => {
    expect(
      blocksToMarkdown([
        {
          kind: 'code-block',
          label: null,
          language: 'ts',
          path: 'vite.config.ts',
          source: 'export default {};',
        },
      ]),
    ).toBe('```ts [vite.config.ts]\nexport default {};\n```');
  });

  it('renders a divider', () => {
    expect(
      blocksToMarkdown([
        {
          kind: 'divider',
        },
      ]),
    ).toBe('---');
  });

  it('renders a quote', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            paragraph('Be brief.'),
          ],
          kind: 'quote',
        },
      ]),
    ).toBe('> Be brief.');
  });

  it('renders a callout with variant title fallback', () => {
    expect(
      blocksToMarkdown([
        {
          children: [
            paragraph('Use it.'),
          ],
          kind: 'callout',
          title: null,
          variant: 'tip',
        },
      ]),
    ).toBe('> **Tip**\n>\n> Use it.');
  });

  it('renders a table', () => {
    expect(
      blocksToMarkdown([
        {
          body: [
            {
              children: [
                {
                  children: [
                    {
                      kind: 'text',
                      value: 'a',
                    },
                  ],
                  header: false,
                  kind: 'table-cell',
                },
                {
                  children: [
                    {
                      kind: 'text',
                      value: 'b',
                    },
                  ],
                  header: false,
                  kind: 'table-cell',
                },
              ],
              kind: 'table-row',
            },
          ],
          head: {
            children: [
              {
                children: [
                  {
                    kind: 'text',
                    value: 'Col 1',
                  },
                ],
                header: true,
                kind: 'table-cell',
              },
              {
                children: [
                  {
                    kind: 'text',
                    value: 'Col 2',
                  },
                ],
                header: true,
                kind: 'table-cell',
              },
            ],
            kind: 'table-row',
          },
          kind: 'table',
        },
      ]),
    ).toBe('| Col 1 | Col 2 |\n| --- | --- |\n| a | b |');
  });

  it('renders a switch with one section per branch', () => {
    expect(
      blocksToMarkdown([
        {
          branches: {
            react: [
              paragraph('react content'),
            ],
            vue: [
              paragraph('vue content'),
            ],
          },
          group: 'framework',
          kind: 'switch',
        },
      ]),
    ).toContain('#### framework: react');
  });

  it('skips picker blocks', () => {
    expect(
      blocksToMarkdown([
        {
          group: 'framework',
          kind: 'picker',
        },
        paragraph('Below'),
      ]),
    ).toBe('Below');
  });

  it('renders output with locale prefixes', () => {
    expect(
      blocksToMarkdown([
        {
          kind: 'output',
          lines: [
            {
              locale: 'en-US',
              value: "'June 17, 2026'",
            },
            {
              locale: 'sv-SE',
              value: "'17 juni 2026'",
            },
          ],
        },
      ]),
    ).toBe("```output\nen-US: 'June 17, 2026'\nsv-SE: '17 juni 2026'\n```");
  });

  it('renders diagnostics with status markers', () => {
    expect(
      blocksToMarkdown([
        {
          kind: 'diagnostics',
          language: 'ts',
          lines: [
            {
              code: "t('Hi {name}', { name: 'Ada' })",
              message: null,
              status: 'ok',
            },
            {
              code: "t('Hi {name}', {})",
              message: 'missing name',
              status: 'error',
            },
          ],
        },
      ]),
    ).toBe(
      "```ts\n✓ t('Hi {name}', { name: 'Ada' })\n✗ t('Hi {name}', {})  // missing name\n```",
    );
  });
});
