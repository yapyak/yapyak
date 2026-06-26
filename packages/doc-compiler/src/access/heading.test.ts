import type { Page } from '../build';
import type { Block, HeadingBlock, SwitchBlock } from './block';

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

function switchBlock(
  group: string,
  branches: Record<string, Block[]>,
): SwitchBlock {
  return {
    branches,
    group,
    type: 'switch',
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
          switchContexts: [],
          text: 'Hello',
        },
        {
          id: 'world',
          level: 2,
          switchContexts: [],
          text: 'World',
        },
        {
          id: 'settings',
          level: 6,
          switchContexts: [],
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
          switchContexts: [],
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
          switchContexts: [],
          text: 'Hello',
        },
      ]);
    });
  });

  describe('with switch branches', () => {
    it('records the switch context for headings inside a branch', () => {
      expect(
        getHeadings(
          page([
            switchBlock('framework', {
              astro: [
                heading(3, 'astro.config.ts'),
              ],
              react: [
                heading(3, 'vite.config.ts'),
              ],
            }),
          ]),
        ),
      ).toEqual([
        {
          id: 'astro.config.ts',
          level: 3,
          switchContexts: [
            {
              group: 'framework',
              value: 'astro',
            },
          ],
          text: 'astro.config.ts',
        },
        {
          id: 'vite.config.ts',
          level: 3,
          switchContexts: [
            {
              group: 'framework',
              value: 'react',
            },
          ],
          text: 'vite.config.ts',
        },
      ]);
    });

    it('records nested switch contexts in outer-to-inner order', () => {
      expect(
        getHeadings(
          page([
            switchBlock('framework', {
              react: [
                switchBlock('packageManager', {
                  pnpm: [
                    heading(3, 'pnpm setup'),
                  ],
                }),
              ],
            }),
          ]),
        ),
      ).toEqual([
        {
          id: 'pnpm setup',
          level: 3,
          switchContexts: [
            {
              group: 'framework',
              value: 'react',
            },
            {
              group: 'packageManager',
              value: 'pnpm',
            },
          ],
          text: 'pnpm setup',
        },
      ]);
    });

    it('mixes top-level and switch-scoped headings in document order', () => {
      expect(
        getHeadings(
          page([
            heading(2, 'Setup'),
            switchBlock('framework', {
              react: [
                heading(3, 'vite.config.ts'),
              ],
            }),
            heading(3, 'yapyak.config.ts'),
          ]),
        ),
      ).toEqual([
        {
          id: 'setup',
          level: 2,
          switchContexts: [],
          text: 'Setup',
        },
        {
          id: 'vite.config.ts',
          level: 3,
          switchContexts: [
            {
              group: 'framework',
              value: 'react',
            },
          ],
          text: 'vite.config.ts',
        },
        {
          id: 'yapyak.config.ts',
          level: 3,
          switchContexts: [],
          text: 'yapyak.config.ts',
        },
      ]);
    });
  });
});
