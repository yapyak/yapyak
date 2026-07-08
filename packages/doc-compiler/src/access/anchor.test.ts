import type { HeadingBlock } from './block';

import { describe, expect, it } from 'vitest';

import { getAnchors } from './anchor';

function heading(level: HeadingBlock['level'], text: string): HeadingBlock {
  return {
    children: [
      {
        kind: 'text',
        value: text,
      },
    ],
    id: text.toLowerCase(),
    kind: 'heading',
    level,
  };
}

describe('getAnchors', () => {
  describe('with defaults', () => {
    it('lists every heading at every level', () => {
      expect(
        getAnchors([
          heading(1, 'Hello'),
          heading(2, 'World'),
          heading(6, 'Settings'),
        ]),
      ).toEqual([
        {
          id: 'hello',
          level: 1,
          text: 'Hello',
        },
        {
          id: 'world',
          level: 2,
          text: 'World',
        },
        {
          id: 'settings',
          level: 6,
          text: 'Settings',
        },
      ]);
    });

    it('returns an empty list when no heading exists', () => {
      expect(
        getAnchors([
          {
            kind: 'divider',
          },
        ]),
      ).toEqual([]);
    });
  });

  describe('with overrides', () => {
    it('lists every heading at or above `minLevel`', () => {
      expect(
        getAnchors(
          [
            heading(1, 'Hello'),
            heading(3, 'World'),
          ],
          {
            minLevel: 2,
          },
        ),
      ).toEqual([
        {
          id: 'world',
          level: 3,
          text: 'World',
        },
      ]);
    });

    it('lists every heading at or below `maxLevel`', () => {
      expect(
        getAnchors(
          [
            heading(2, 'Hello'),
            heading(4, 'World'),
          ],
          {
            maxLevel: 3,
          },
        ),
      ).toEqual([
        {
          id: 'hello',
          level: 2,
          text: 'Hello',
        },
      ]);
    });
  });
});
