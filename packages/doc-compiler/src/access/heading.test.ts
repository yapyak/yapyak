import type { Page } from '../build';
import type { HeadingBlock } from './block';

import { describe, expect, it } from 'vitest';

import { getHeadings } from './heading';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    description: '',
    href: '/guide/settings',
    meta: {},
    title: 'Settings',
  };
}

function heading(level: HeadingBlock['level'], text: string): HeadingBlock {
  return {
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
    id: text.toLowerCase(),
    level,
    type: 'heading',
  };
}

describe('getHeadings', () => {
  describe('with defaults', () => {
    it('lists every heading at every level', () => {
      expect(
        getHeadings(
          page([
            heading(1, 'Hello'),
            heading(2, 'World'),
            heading(6, 'Settings'),
          ]),
        ),
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
        getHeadings(
          page([
            {
              type: 'divider',
            },
          ]),
        ),
      ).toEqual([]);
    });
  });

  describe('with overrides', () => {
    it('lists every heading at or above `minLevel`', () => {
      expect(
        getHeadings(
          page([
            heading(1, 'Hello'),
            heading(3, 'World'),
          ]),
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
        getHeadings(
          page([
            heading(2, 'Hello'),
            heading(4, 'World'),
          ]),
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
