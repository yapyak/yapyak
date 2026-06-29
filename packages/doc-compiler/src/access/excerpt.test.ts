import type { Page } from '../build';

import { describe, expect, it } from 'vitest';

import { getExcerpt } from './excerpt';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    description: '',
    href: '/guide/settings',
    meta: {},
    title: 'Settings',
  };
}

function paragraph(text: string): Page['blocks'][number] {
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

describe('getExcerpt', () => {
  describe('with defaults', () => {
    it('returns the first paragraph text', () => {
      expect(
        getExcerpt(
          page([
            paragraph('Hello World'),
          ]),
        ),
      ).toBe('Hello World');
    });

    it('returns the truncated text with ellipsis when over `maxLength`', () => {
      const text = 'Hello '.repeat(40).trim();
      expect(
        getExcerpt(
          page([
            paragraph(text),
          ]),
        ),
      ).toBe(`${text.slice(0, 159).trimEnd()}…`);
    });

    it('skips paragraphs with no text', () => {
      expect(
        getExcerpt(
          page([
            paragraph('   '),
            paragraph('Hello'),
          ]),
        ),
      ).toBe('Hello');
    });

    it('skips blocks that are not paragraphs', () => {
      expect(
        getExcerpt(
          page([
            {
              kind: 'divider',
            },
            paragraph('Hello'),
          ]),
        ),
      ).toBe('Hello');
    });

    it('returns an empty string when no paragraph exists', () => {
      expect(
        getExcerpt(
          page([
            {
              kind: 'divider',
            },
          ]),
        ),
      ).toBe('');
    });
  });

  describe('with overrides', () => {
    it('returns the full text when under the custom `maxLength`', () => {
      expect(
        getExcerpt(
          page([
            paragraph('Hello World'),
          ]),
          {
            maxLength: 20,
          },
        ),
      ).toBe('Hello World');
    });

    it('returns the truncated text when over the custom `maxLength`', () => {
      expect(
        getExcerpt(
          page([
            paragraph('Hello World'),
          ]),
          {
            maxLength: 6,
          },
        ),
      ).toBe('Hello…');
    });
  });
});
