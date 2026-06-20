import type { Block } from './block';

import { describe, expect, it } from 'vitest';

import { blocksToMarkdown } from './markdown';

function paragraph(text: string): Block {
  return {
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
    type: 'paragraph',
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
              type: 'text',
              value: 'Installation',
            },
          ],
          id: 'installation',
          level: 1,
          type: 'heading',
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
              type: 'text',
              value: 'H',
            },
          ],
          id: 'h',
          level: level as 1 | 2 | 3 | 4 | 5 | 6,
          type: 'heading',
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
              type: 'text',
              value: 'mix ',
            },
            {
              children: [
                {
                  type: 'text',
                  value: 'bold',
                },
              ],
              type: 'strong',
            },
            {
              type: 'text',
              value: ' and ',
            },
            {
              children: [
                {
                  type: 'text',
                  value: 'em',
                },
              ],
              type: 'emphasis',
            },
          ],
          type: 'paragraph',
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
              type: 'inline-code',
              value: "t('Save')",
            },
          ],
          type: 'paragraph',
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
                  type: 'text',
                  value: 'Docs',
                },
              ],
              href: 'https://yapyak.dev',
              kind: 'external',
              type: 'link',
            },
          ],
          type: 'paragraph',
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
              type: 'list-item',
            },
            {
              children: [
                paragraph('second'),
              ],
              type: 'list-item',
            },
          ],
          ordered: false,
          type: 'list',
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
              type: 'list-item',
            },
            {
              children: [
                paragraph('two'),
              ],
              type: 'list-item',
            },
          ],
          ordered: true,
          type: 'list',
        },
      ]),
    ).toBe('1. one\n2. two');
  });

  it('renders a code block with language', () => {
    expect(
      blocksToMarkdown([
        {
          label: null,
          language: 'ts',
          path: null,
          source: "import { t } from 'yapyak';",
          type: 'code-block',
        },
      ]),
    ).toBe("```ts\nimport { t } from 'yapyak';\n```");
  });

  it('renders a code block with path in fence info', () => {
    expect(
      blocksToMarkdown([
        {
          label: null,
          language: 'ts',
          path: 'vite.config.ts',
          source: 'export default {};',
          type: 'code-block',
        },
      ]),
    ).toBe('```ts [vite.config.ts]\nexport default {};\n```');
  });

  it('renders a divider', () => {
    expect(
      blocksToMarkdown([
        {
          type: 'divider',
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
          type: 'quote',
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
          title: null,
          type: 'callout',
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
                      type: 'text',
                      value: 'a',
                    },
                  ],
                  header: false,
                  type: 'table-cell',
                },
                {
                  children: [
                    {
                      type: 'text',
                      value: 'b',
                    },
                  ],
                  header: false,
                  type: 'table-cell',
                },
              ],
              type: 'table-row',
            },
          ],
          head: {
            children: [
              {
                children: [
                  {
                    type: 'text',
                    value: 'Col 1',
                  },
                ],
                header: true,
                type: 'table-cell',
              },
              {
                children: [
                  {
                    type: 'text',
                    value: 'Col 2',
                  },
                ],
                header: true,
                type: 'table-cell',
              },
            ],
            type: 'table-row',
          },
          type: 'table',
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
          type: 'switch',
        },
      ]),
    ).toContain('#### framework: react');
  });

  it('skips picker blocks', () => {
    expect(
      blocksToMarkdown([
        {
          group: 'framework',
          type: 'picker',
        },
        paragraph('Below'),
      ]),
    ).toBe('Below');
  });

  it('renders output with locale prefixes', () => {
    expect(
      blocksToMarkdown([
        {
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
          type: 'output',
        },
      ]),
    ).toBe("```output\nen-US: 'June 17, 2026'\nsv-SE: '17 juni 2026'\n```");
  });

  it('renders diagnostics with status markers', () => {
    expect(
      blocksToMarkdown([
        {
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
          type: 'diagnostics',
        },
      ]),
    ).toBe(
      "```ts\n✓ t('Hi {name}', { name: 'Ada' })\n✗ t('Hi {name}', {})  // missing name\n```",
    );
  });
});
