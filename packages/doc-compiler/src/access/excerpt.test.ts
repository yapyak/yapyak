import type { Block } from './block';

import { describe, expect, it } from 'vitest';

import { getExcerpt } from './excerpt';

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

describe('getExcerpt', () => {
  describe('with defaults', () => {
    it('returns the first paragraph text', () => {
      expect(
        getExcerpt([
          paragraph('Hello World'),
        ]),
      ).toBe('Hello World');
    });

    it('returns the truncated text with ellipsis when over `maxLength`', () => {
      const text = 'Hello '.repeat(40).trim();
      expect(
        getExcerpt([
          paragraph(text),
        ]),
      ).toBe(`${text.slice(0, 159).trimEnd()}…`);
    });

    it('skips paragraphs with no text', () => {
      expect(
        getExcerpt([
          paragraph('   '),
          paragraph('Hello'),
        ]),
      ).toBe('Hello');
    });

    it('skips blocks that are not paragraphs', () => {
      expect(
        getExcerpt([
          {
            kind: 'divider',
          },
          paragraph('Hello'),
        ]),
      ).toBe('Hello');
    });

    it('returns an empty string when no paragraph exists', () => {
      expect(
        getExcerpt([
          {
            kind: 'divider',
          },
        ]),
      ).toBe('');
    });
  });

  describe('with overrides', () => {
    it('returns the full text when under the custom `maxLength`', () => {
      expect(
        getExcerpt(
          [
            paragraph('Hello World'),
          ],
          {
            maxLength: 20,
          },
        ),
      ).toBe('Hello World');
    });

    it('returns the truncated text when over the custom `maxLength`', () => {
      expect(
        getExcerpt(
          [
            paragraph('Hello World'),
          ],
          {
            maxLength: 6,
          },
        ),
      ).toBe('Hello…');
    });
  });
});
