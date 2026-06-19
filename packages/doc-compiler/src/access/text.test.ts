import type { Page } from '../build';

import { describe, expect, it } from 'vitest';

import { blockToText, getText } from './text';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    description: '',
    href: '/guide/settings',
    meta: {},
    title: 'Settings',
  };
}

describe('blockToText', () => {
  it('returns the value of a `text` block', () => {
    expect(
      blockToText({
        type: 'text',
        value: 'Hello',
      }),
    ).toBe('Hello');
  });

  it('returns the value of an `inline-code` block', () => {
    expect(
      blockToText({
        type: 'inline-code',
        value: 'Settings',
      }),
    ).toBe('Settings');
  });

  it('returns the joined `children` of a `paragraph`', () => {
    expect(
      blockToText({
        children: [
          {
            type: 'text',
            value: 'Hello',
          },
          {
            type: 'text',
            value: ' World',
          },
        ],
        type: 'paragraph',
      }),
    ).toBe('Hello World');
  });

  it('returns `children` joined by newline for a `list`', () => {
    expect(
      blockToText({
        children: [
          {
            children: [
              {
                type: 'text',
                value: 'Hello',
              },
            ],
            type: 'list-item',
          },
          {
            children: [
              {
                type: 'text',
                value: 'World',
              },
            ],
            type: 'list-item',
          },
        ],
        ordered: false,
        type: 'list',
      }),
    ).toBe('Hello\nWorld');
  });

  it('returns the `source` of a `code-block`', () => {
    expect(
      blockToText({
        label: null,
        language: 'ts',
        path: null,
        source: 'Hello',
        type: 'code-block',
      }),
    ).toBe('Hello');
  });

  it('returns every branch joined by blank line for a `switch`', () => {
    expect(
      blockToText({
        branches: {
          react: [
            {
              type: 'text',
              value: 'Hello',
            },
          ],
          vue: [
            {
              type: 'text',
              value: 'World',
            },
          ],
        },
        group: 'framework',
        type: 'switch',
      }),
    ).toBe('Hello\n\nWorld');
  });

  it('returns the locale-prefixed value of an `output` line', () => {
    expect(
      blockToText({
        lines: [
          {
            locale: 'en',
            value: 'Hello',
          },
        ],
        type: 'output',
      }),
    ).toBe('en: Hello');
  });

  it('returns the value of an `output` line when locale is `null`', () => {
    expect(
      blockToText({
        lines: [
          {
            locale: null,
            value: 'Hello',
          },
        ],
        type: 'output',
      }),
    ).toBe('Hello');
  });

  it('returns the code and message of a `diagnostics` line', () => {
    expect(
      blockToText({
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: 'World',
            status: 'error',
          },
        ],
        type: 'diagnostics',
      }),
    ).toBe('Hello — World');
  });

  it('returns the code of a `diagnostics` line when message is `null`', () => {
    expect(
      blockToText({
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: null,
            status: 'ok',
          },
        ],
        type: 'diagnostics',
      }),
    ).toBe('Hello');
  });

  it('returns rows joined by newline for a `table` with `head`', () => {
    expect(
      blockToText({
        body: [
          {
            children: [
              {
                children: [
                  {
                    type: 'text',
                    value: 'World',
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
                  value: 'Hello',
                },
              ],
              header: true,
              type: 'table-cell',
            },
          ],
          type: 'table-row',
        },
        type: 'table',
      }),
    ).toBe('Hello\nWorld');
  });

  it('returns body rows only for a `table` when `head` is `null`', () => {
    expect(
      blockToText({
        body: [
          {
            children: [
              {
                children: [
                  {
                    type: 'text',
                    value: 'Hello',
                  },
                ],
                header: false,
                type: 'table-cell',
              },
            ],
            type: 'table-row',
          },
        ],
        head: null,
        type: 'table',
      }),
    ).toBe('Hello');
  });

  it('returns the `alt` of an `image`', () => {
    expect(
      blockToText({
        alt: 'Hello',
        src: 'https://example.com/hello.png',
        type: 'image',
      }),
    ).toBe('Hello');
  });

  it('returns an empty string for an `image` when `alt` is `null`', () => {
    expect(
      blockToText({
        alt: null,
        src: 'https://example.com/hello.png',
        type: 'image',
      }),
    ).toBe('');
  });

  it('returns the `kind` of an `eyebrow` when set', () => {
    expect(
      blockToText({
        kind: 'function',
        module: 'yapyak',
        sourceHref: null,
        type: 'eyebrow',
      }),
    ).toBe('function');
  });

  it('returns the `module` of an `eyebrow` when `kind` is `null`', () => {
    expect(
      blockToText({
        kind: null,
        module: 'yapyak',
        sourceHref: null,
        type: 'eyebrow',
      }),
    ).toBe('yapyak');
  });

  it('returns the file and line of a `code-location`', () => {
    expect(
      blockToText({
        file: 'src/a.ts',
        href: null,
        line: 42,
        type: 'code-location',
      }),
    ).toBe('src/a.ts:42');
  });

  it('returns an empty string for a `divider`', () => {
    expect(
      blockToText({
        type: 'divider',
      }),
    ).toBe('');
  });

  it('returns an empty string for a `line-break`', () => {
    expect(
      blockToText({
        type: 'line-break',
      }),
    ).toBe('');
  });
});

describe('getText', () => {
  it('returns the page text joined by newline', () => {
    expect(
      getText(
        page([
          {
            children: [
              {
                type: 'text',
                value: 'Hello',
              },
            ],
            type: 'paragraph',
          },
          {
            children: [
              {
                type: 'text',
                value: 'World',
              },
            ],
            type: 'paragraph',
          },
        ]),
      ),
    ).toBe('Hello\nWorld');
  });

  it('returns an empty string when no block has text', () => {
    expect(
      getText(
        page([
          {
            type: 'divider',
          },
        ]),
      ),
    ).toBe('');
  });
});
