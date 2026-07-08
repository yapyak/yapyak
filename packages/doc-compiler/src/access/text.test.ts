import type { Page } from '../build';

import { describe, expect, it } from 'vitest';

import { blockToText, getText } from './text';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    breadcrumbs: [],
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
        kind: 'text',
        value: 'Hello',
      }),
    ).toBe('Hello');
  });

  it('returns the value of an `inline-code` block', () => {
    expect(
      blockToText({
        kind: 'inline-code',
        value: 'Settings',
      }),
    ).toBe('Settings');
  });

  it('returns the joined `children` of a `paragraph`', () => {
    expect(
      blockToText({
        children: [
          {
            kind: 'text',
            value: 'Hello',
          },
          {
            kind: 'text',
            value: ' World',
          },
        ],
        kind: 'paragraph',
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
                kind: 'text',
                value: 'Hello',
              },
            ],
            kind: 'list-item',
          },
          {
            children: [
              {
                kind: 'text',
                value: 'World',
              },
            ],
            kind: 'list-item',
          },
        ],
        kind: 'list',
        ordered: false,
      }),
    ).toBe('Hello\nWorld');
  });

  it('returns the `source` of a `code-block`', () => {
    expect(
      blockToText({
        kind: 'code-block',
        label: null,
        language: 'ts',
        path: null,
        source: 'Hello',
      }),
    ).toBe('Hello');
  });

  it('returns every branch joined by blank line for a `switch`', () => {
    expect(
      blockToText({
        branches: {
          react: [
            {
              kind: 'text',
              value: 'Hello',
            },
          ],
          vue: [
            {
              kind: 'text',
              value: 'World',
            },
          ],
        },
        group: 'framework',
        kind: 'switch',
      }),
    ).toBe('Hello\n\nWorld');
  });

  it('returns the locale-prefixed value of an `output` line', () => {
    expect(
      blockToText({
        kind: 'output',
        lines: [
          {
            locale: 'en',
            value: 'Hello',
          },
        ],
      }),
    ).toBe('en: Hello');
  });

  it('returns the value of an `output` line when locale is `null`', () => {
    expect(
      blockToText({
        kind: 'output',
        lines: [
          {
            locale: null,
            value: 'Hello',
          },
        ],
      }),
    ).toBe('Hello');
  });

  it('returns the code and message of a `diagnostics` line', () => {
    expect(
      blockToText({
        kind: 'diagnostic',
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: 'World',
            status: 'error',
          },
        ],
      }),
    ).toBe('Hello — World');
  });

  it('returns the code of a `diagnostics` line when message is `null`', () => {
    expect(
      blockToText({
        kind: 'diagnostic',
        language: 'ts',
        lines: [
          {
            code: 'Hello',
            message: null,
            status: 'ok',
          },
        ],
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
                    kind: 'text',
                    value: 'World',
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
                  value: 'Hello',
                },
              ],
              header: true,
              kind: 'table-cell',
            },
          ],
          kind: 'table-row',
        },
        kind: 'table',
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
                    kind: 'text',
                    value: 'Hello',
                  },
                ],
                header: false,
                kind: 'table-cell',
              },
            ],
            kind: 'table-row',
          },
        ],
        head: null,
        kind: 'table',
      }),
    ).toBe('Hello');
  });

  it('returns the `alt` of an `image`', () => {
    expect(
      blockToText({
        alt: 'Hello',
        kind: 'image',
        src: 'https://example.com/hello.png',
      }),
    ).toBe('Hello');
  });

  it('returns an empty string for an `image` when `alt` is `null`', () => {
    expect(
      blockToText({
        alt: null,
        kind: 'image',
        src: 'https://example.com/hello.png',
      }),
    ).toBe('');
  });

  it('returns the `kind` of an `eyebrow` when set', () => {
    expect(
      blockToText({
        exportKind: 'function',
        kind: 'eyebrow',
        module: 'yapyak',
        sourceHref: null,
      }),
    ).toBe('function');
  });

  it('returns the `module` of an `eyebrow` when `kind` is `null`', () => {
    expect(
      blockToText({
        exportKind: null,
        kind: 'eyebrow',
        module: 'yapyak',
        sourceHref: null,
      }),
    ).toBe('yapyak');
  });

  it('returns the file and line of a `code-location`', () => {
    expect(
      blockToText({
        file: 'src/a.ts',
        href: null,
        kind: 'code-location',
        line: 42,
      }),
    ).toBe('src/a.ts:42');
  });

  it('returns an empty string for a `divider`', () => {
    expect(
      blockToText({
        kind: 'divider',
      }),
    ).toBe('');
  });

  it('returns an empty string for a `line-break`', () => {
    expect(
      blockToText({
        kind: 'line-break',
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
                kind: 'text',
                value: 'Hello',
              },
            ],
            kind: 'paragraph',
          },
          {
            children: [
              {
                kind: 'text',
                value: 'World',
              },
            ],
            kind: 'paragraph',
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
            kind: 'divider',
          },
        ]),
      ),
    ).toBe('');
  });
});
