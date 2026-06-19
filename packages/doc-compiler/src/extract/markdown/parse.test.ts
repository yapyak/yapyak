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
            type: 'text',
            value: 'Hello',
          },
        ],
        type: 'paragraph',
      },
    ]);
  });

  it('parses a heading to a `heading` block with a slug `id`', () => {
    expect(parseMarkdown('## Hello World').blocks).toEqual([
      {
        children: [
          {
            type: 'text',
            value: 'Hello World',
          },
        ],
        id: 'hello-world',
        level: 2,
        type: 'heading',
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
              type: 'text',
              value: 'Hello',
            },
          ],
          href: 'https://example.com',
          kind: 'external',
          type: 'link',
        },
      ],
      type: 'paragraph',
    });
  });

  it('parses an absolute link to a `link` block of kind `internal`', () => {
    const [paragraph] = parseMarkdown('[Settings](/guide/settings)').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          children: [
            {
              type: 'text',
              value: 'Settings',
            },
          ],
          href: '/guide/settings',
          kind: 'internal',
          type: 'link',
        },
      ],
      type: 'paragraph',
    });
  });

  it('parses inline code to an `inline-code` block', () => {
    const [paragraph] = parseMarkdown('`Settings`').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          type: 'inline-code',
          value: 'Settings',
        },
      ],
      type: 'paragraph',
    });
  });

  it('parses `**strong**` to a `strong` block', () => {
    const [paragraph] = parseMarkdown('**Hello**').blocks;
    expect(paragraph).toEqual({
      children: [
        {
          children: [
            {
              type: 'text',
              value: 'Hello',
            },
          ],
          type: 'strong',
        },
      ],
      type: 'paragraph',
    });
  });

  it('parses a fenced code block to a `code-block` with `language`', () => {
    const source = '```ts\nHello\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        label: null,
        language: 'ts',
        path: null,
        source: 'Hello\n',
        type: 'code-block',
      },
    ]);
  });

  it('parses a fenced code block with `[label]` to a labelled `code-block`', () => {
    const source = '```ts [Hello]\nWorld\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        label: 'Hello',
        language: 'ts',
        path: null,
        source: 'World\n',
        type: 'code-block',
      },
    ]);
  });

  it('parses a fenced code block with `[path.ext]` to a `code-block` with `path`', () => {
    const source = '```ts [src/a.ts]\nHello\n```';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        label: null,
        language: 'ts',
        path: 'src/a.ts',
        source: 'Hello\n',
        type: 'code-block',
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
                type: 'text',
                value: 'Hello',
              },
            ],
            type: 'paragraph',
          },
        ],
        title: null,
        type: 'callout',
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
                type: 'text',
                value: 'Hello',
              },
            ],
            type: 'paragraph',
          },
        ],
        vue: [
          {
            children: [
              {
                type: 'text',
                value: 'World',
              },
            ],
            type: 'paragraph',
          },
        ],
      },
      group: 'framework',
      type: 'switch',
    });
  });

  it('parses an `output` tag with locale prefix to a labelled `output` line', () => {
    const source = '{% output %}\nen: Hello\nsv: Hej\n{% /output %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        lines: [
          {
            locale: 'en',
            value: 'Hello',
          },
          {
            locale: 'sv',
            value: 'Hej',
          },
        ],
        type: 'output',
      },
    ]);
  });

  it('parses an `output` tag without locale prefix to a `null`-locale line', () => {
    const source = '{% output %}\nHello\n{% /output %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        lines: [
          {
            locale: null,
            value: 'Hello',
          },
        ],
        type: 'output',
      },
    ]);
  });

  it('parses a `diagnostics` tag with `ok` annotation to an ok `diagnostics` line', () => {
    const source = '{% diagnostics %}\nHello // ok\n{% /diagnostics %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: null,
            status: 'ok',
          },
        ],
        type: 'diagnostics',
      },
    ]);
  });

  it('parses a `diagnostics` tag with `error: msg` annotation to an error line', () => {
    const source =
      '{% diagnostics %}\nHello // error: World\n{% /diagnostics %}';
    expect(parseMarkdown(source).blocks).toEqual([
      {
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: 'World',
            status: 'error',
          },
        ],
        type: 'diagnostics',
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
          type: 'text',
          value: 'Hello',
        },
      ],
      type: 'paragraph',
    });
  });
});
