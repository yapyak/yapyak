import { describe, expect, it } from 'vitest';

import { parseFrontmatterOnly, parseMarkdown } from './parse';

describe('parseFrontmatterOnly', () => {
  it('parses every key from the frontmatter block', () => {
    expect(
      parseFrontmatterOnly('---\ntitle: Settings\norder: 3\n---\nHello'),
    ).toEqual({
      order: 3,
      title: 'Settings',
    });
  });

  it('returns an empty object when no frontmatter is present', () => {
    expect(parseFrontmatterOnly('Hello')).toEqual({});
  });
});

describe('parseMarkdown', () => {
  it('parses a paragraph to a `paragraph` block', () => {
    expect(parseMarkdown('Hello').blocks).toEqual([
      {
        children: [
          {
            kind: 'text',
            value: 'Hello',
          },
        ],
        kind: 'paragraph',
      },
    ]);
  });

  it('parses a heading to a `heading` block with a slug `id`', () => {
    expect(parseMarkdown('## Hello World').blocks).toEqual([
      {
        children: [
          {
            kind: 'text',
            value: 'Hello World',
          },
        ],
        id: 'hello-world',
        kind: 'heading',
        level: 2,
      },
    ]);
  });

  it('parses an external link to a `link` block of kind `external`', () => {
    const [paragraph] = parseMarkdown('[Hello](https://example.com)').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          children: [
            {
              kind: 'text',
              value: 'Hello',
            },
          ],
          href: 'https://example.com',
          kind: 'link',
          linkKind: 'external',
        },
      ],
      kind: 'paragraph',
    });
  });

  it('parses an absolute link to a `link` block of kind `internal`', () => {
    const [paragraph] = parseMarkdown('[Settings](/guide/settings)').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          children: [
            {
              kind: 'text',
              value: 'Settings',
            },
          ],
          href: '/guide/settings',
          kind: 'link',
          linkKind: 'internal',
        },
      ],
      kind: 'paragraph',
    });
  });

  it('parses inline code to an `inline-code` block', () => {
    const [paragraph] = parseMarkdown('`Settings`').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          kind: 'inline-code',
          value: 'Settings',
        },
      ],
      kind: 'paragraph',
    });
  });

  it('parses `**strong**` to a `strong` block', () => {
    const [paragraph] = parseMarkdown('**Hello**').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          children: [
            {
              kind: 'text',
              value: 'Hello',
            },
          ],
          kind: 'strong',
        },
      ],
      kind: 'paragraph',
    });
  });

  it('parses a fenced code block to a `code-block` with `language`', () => {
    const source = '```ts\nHello\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: null,
        source: 'Hello\n',
      },
    ]);
  });

  it('parses a fenced code block with `[label]` to a labelled `code-block`', () => {
    const source = '```ts [Hello]\nWorld\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: 'Hello',
        language: 'ts',
        path: null,
        source: 'World\n',
      },
    ]);
  });

  it('parses a fenced code block with `[path.ext]` to a `code-block` with `path`', () => {
    const source = '```ts [src/a.ts]\nHello\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: 'src/a.ts',
        source: 'Hello\n',
      },
    ]);
  });

  it('parses a fenced code block with a dotfile `[.gitignore]` to a `code-block` with `path`', () => {
    const source = '```[.gitignore]\n.yapyak\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: null,
        path: '.gitignore',
        source: '.yapyak\n',
      },
    ]);
  });

  it('parses a `callout` tag to a `callout` block', () => {
    const source = '{% callout variant="info" %}\nHello\n{% /callout %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        children: [
          {
            children: [
              {
                kind: 'text',
                value: 'Hello',
              },
            ],
            kind: 'paragraph',
          },
        ],
        kind: 'callout',
        title: null,
        variant: 'info',
      },
    ]);
  });

  it('parses a `switch` tag to a `switch` block with branches', () => {
    const source =
      '{% switch group="framework" %}\n{% when value="react" %}\nHello\n{% /when %}\n{% when value="vue" %}\nWorld\n{% /when %}\n{% /switch %}';
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      branches: {
        react: [
          {
            children: [
              {
                kind: 'text',
                value: 'Hello',
              },
            ],
            kind: 'paragraph',
          },
        ],
        vue: [
          {
            children: [
              {
                kind: 'text',
                value: 'World',
              },
            ],
            kind: 'paragraph',
          },
        ],
      },
      group: 'framework',
      kind: 'switch',
    });
  });

  it('extracts a single `// output:` line into a code + output block pair', () => {
    const source = "```ts\nt('Save'); // output: 'Spara'\n```";
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: null,
        source: "t('Save');",
      },
      {
        kind: 'output',
        lines: [
          {
            locale: null,
            value: "'Spara'",
          },
        ],
      },
    ]);
  });

  it('extracts a bare `// output:` header followed by locale-prefixed continuation lines', () => {
    const source = [
      '```ts',
      "format.number(199, { style: 'currency', currency: 'EUR' });",
      '// output:',
      "// en-US: '€199.00'",
      "// sv-SE: '199,00 €'",
      '```',
    ].join('\n');
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: null,
        source: "format.number(199, { style: 'currency', currency: 'EUR' });",
      },
      {
        kind: 'output',
        lines: [
          {
            locale: 'en-US',
            value: "'€199.00'",
          },
          {
            locale: 'sv-SE',
            value: "'199,00 €'",
          },
        ],
      },
    ]);
  });

  it('extracts consecutive `// output:` lines with locale prefix into a single output block', () => {
    const source =
      "```ts\nt('Save');\n// output: en: 'Save'\n// output: sv: 'Spara'\n```";
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: null,
        source: "t('Save');",
      },
      {
        kind: 'output',
        lines: [
          {
            locale: 'en',
            value: "'Save'",
          },
          {
            locale: 'sv',
            value: "'Spara'",
          },
        ],
      },
    ]);
  });

  it('extracts a multi-line `// output:` continuation with preserved indentation', () => {
    const source =
      "```ts\nparseRichText(t('Hello'));\n// output: [\n//   { kind: 'text', text: 'Hello' },\n// ]\n```";
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: null,
        source: "parseRichText(t('Hello'));",
      },
      {
        kind: 'output',
        lines: [
          {
            locale: null,
            value: '[',
          },
          {
            locale: null,
            value: "  { kind: 'text', text: 'Hello' },",
          },
          {
            locale: null,
            value: ']',
          },
        ],
      },
    ]);
  });

  it('parses a `diagnostics` tag with `ok` annotation to an ok `diagnostics` line', () => {
    const source = '{% diagnostics %}\nHello // ok\n{% /diagnostics %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'diagnostic',
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: null,
            status: 'ok',
          },
        ],
      },
    ]);
  });

  it('parses a `diagnostics` tag with `error: msg` annotation to an error line', () => {
    const source =
      '{% diagnostics %}\nHello // error: World\n{% /diagnostics %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'diagnostic',
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: 'World',
            status: 'error',
          },
        ],
      },
    ]);
  });

  it('returns the parsed frontmatter alongside the blocks', () => {
    const source = '---\ntitle: Settings\n---\nHello';
    const result = parseMarkdown(source);

    expect(result.frontmatter).toEqual({
      title: 'Settings',
    });
    expect(result.blocks[0]).toEqual({
      children: [
        {
          kind: 'text',
          value: 'Hello',
        },
      ],
      kind: 'paragraph',
    });
  });

  it('classifies a table column as `identifier` when every body cell is a single inline-code identifier', () => {
    const source = [
      '| Class | Description |',
      '|---|---|',
      '| `TranslatorAuthError` | Bad API key. |',
      '| `TranslatorRateLimitError` | Rate limited. |',
      '| `TranslatorNetworkError` | Network failure. |',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block?.kind).toBe('table');
    if (block?.kind !== 'table') {
      return;
    }
    expect(block.body[0]?.children[0]?.column).toBe('identifier');
    expect(block.body[0]?.children[1]?.column).toBeUndefined();
  });

  it('classifies a table column as `identifier` when cells wrap inline-code identifiers in a link', () => {
    const source = [
      '| Class |',
      '|---|',
      '| [`TranslatorAuthError`](/x) |',
      '| [`TranslatorRateLimitError`](/y) |',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block?.kind).toBe('table');
    if (block?.kind !== 'table') {
      return;
    }
    expect(block.body[0]?.children[0]?.column).toBe('identifier');
  });

  it('refuses to classify a column as `identifier` when any cell mixes prose with code', () => {
    const source = [
      '| Item |',
      '|---|',
      '| `TranslatorAuthError` |',
      '| `TranslatorRateLimitError`, with retry. |',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block?.kind).toBe('table');
    if (block?.kind !== 'table') {
      return;
    }
    expect(block.body[0]?.children[0]?.column).toBeUndefined();
  });

  it('parses a fenced code block with language `terminal` into a `terminal` block', () => {
    const source = '```terminal\nHello world\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        kind: 'terminal',
        lines: [
          {
            kind: 'terminal-line',
            segments: [
              {
                kind: 'terminal-segment',
                segmentKind: 'text',
                value: 'Hello world',
              },
            ],
          },
        ],
      },
    ]);
  });

  it('preserves leading indentation on each line inside a `terminal` fence', () => {
    const source = [
      '```terminal',
      'Header',
      '    indented once',
      '      indented twice',
      '```',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'Header',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '    indented once',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '      indented twice',
            },
          ],
        },
      ],
    });
  });

  it('preserves blank lines between content inside a `terminal` fence', () => {
    const source = [
      '```terminal',
      'First section',
      '',
      'Second section',
      '```',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'First section',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'Second section',
            },
          ],
        },
      ],
    });
  });

  it('segments `█` characters into `bar-fill` segments and `░` characters into `bar-empty` segments', () => {
    const source = '```terminal\nsv  ████░░  50%\n```';
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'sv  ',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'bar-fill',
              value: '████',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'bar-empty',
              value: '░░',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '  50%',
            },
          ],
        },
      ],
    });
  });

  it('parses inline `<b>`, `<d>`, `<c>`, `<g>`, `<r>`, `<y>` tags into typed segments', () => {
    const source = [
      '```terminal',
      '<b>Translation status</b>',
      '<d>Locales</d> · <g>✔</g> ok · <r>✗</r> err · <y>⚠</y> warn · <c>arrow</c>',
      '```',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'bold',
              value: 'Translation status',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'dim',
              value: 'Locales',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: ' · ',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'green',
              value: '✔',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: ' ok · ',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'red',
              value: '✗',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: ' err · ',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'yellow',
              value: '⚠',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: ' warn · ',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'cyan',
              value: 'arrow',
            },
          ],
        },
      ],
    });
  });

  it('treats `█` as `bar-fill` regardless of an enclosing style tag', () => {
    const source = '```terminal\n<c>████</c><d>░░░</d>\n```';
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'bar-fill',
              value: '████',
            },
            {
              kind: 'terminal-segment',
              segmentKind: 'bar-empty',
              value: '░░░',
            },
          ],
        },
      ],
    });
  });

  it('emits a plain `text` segment for an unknown one-letter tag', () => {
    const source = '```terminal\n<x>not a tag</x>\n```';
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '<x>not a tag</x>',
            },
          ],
        },
      ],
    });
  });

  it('strips the minimum common leading indent across non-blank lines in a `terminal` fence', () => {
    const source = [
      '```terminal',
      '  Header',
      '',
      '  ✗ orphans',
      '    sv — entry',
      '    de — entry',
      '  Run yapyak clean',
      '```',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'Header',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '✗ orphans',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '  sv — entry',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '  de — entry',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'Run yapyak clean',
            },
          ],
        },
      ],
    });
  });

  it('preserves indentation when at least one line has no leading whitespace', () => {
    const source = [
      '```terminal',
      'Header',
      '  child',
      '```',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'Header',
            },
          ],
        },
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: '  child',
            },
          ],
        },
      ],
    });
  });

  it('strips leading and trailing blank lines from a `terminal` fence', () => {
    const source = [
      '```terminal',
      '',
      '',
      'Content',
      '',
      '',
      '```',
    ].join('\n');
    const [block] = parseMarkdown(source).blocks;

    expect(block).toEqual({
      kind: 'terminal',
      lines: [
        {
          kind: 'terminal-line',
          segments: [
            {
              kind: 'terminal-segment',
              segmentKind: 'text',
              value: 'Content',
            },
          ],
        },
      ],
    });
  });
});
