import type { Block, HeadingBlock, SwitchBlock } from '../../access';

import { describe, expect, it } from 'vitest';

import { prefixHeadingIds } from './heading-id';

function heading(level: HeadingBlock['level'], slug: string): HeadingBlock {
  return {
    children: [
      {
        type: 'text',
        value: slug,
      },
    ],
    id: slug,
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

function ids(blocks: Block[]): string[] {
  const result: string[] = [];
  walk(blocks);
  return result;

  function walk(items: Block[]): void {
    for (const block of items) {
      if (block.type === 'heading') {
        result.push(block.id);
      }
      if (block.type === 'switch') {
        for (const branch of Object.values(block.branches)) {
          walk(branch);
        }
      }
    }
  }
}

describe('prefixHeadingIds', () => {
  it('leaves a single top-level heading untouched', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
    ]);
  });

  it('prefixes nested headings with their ancestor chain', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
      heading(3, 'tsconfig-json'),
      heading(3, 'gitignore'),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
      'setup-tsconfig-json',
      'setup-gitignore',
    ]);
  });

  it('resets the chain at the next sibling-level heading', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
      heading(3, 'tsconfig-json'),
      heading(2, 'translator'),
      heading(3, 'wire'),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
      'setup-tsconfig-json',
      'translator',
      'translator-wire',
    ]);
  });

  it('applies the ancestor chain to headings inside switch branches', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
      switchBlock('framework', {
        astro: [
          heading(3, 'astro-config-ts'),
        ],
        react: [
          heading(3, 'vite-config-ts'),
        ],
      }),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
      'setup-astro-config-ts',
      'setup-vite-config-ts',
    ]);
  });

  it('continues correctly after a switch closes', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
      switchBlock('framework', {
        react: [
          heading(3, 'vite-config-ts'),
        ],
      }),
      heading(3, 'yapyak-config-ts'),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
      'setup-vite-config-ts',
      'setup-yapyak-config-ts',
    ]);
  });

  it('treats branches as siblings without bleeding state across them', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
      switchBlock('framework', {
        react: [
          heading(3, 'first'),
          heading(4, 'nested'),
        ],
        vue: [
          heading(3, 'second'),
        ],
      }),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
      'setup-first',
      'setup-first-nested',
      'setup-second',
    ]);
  });

  it('handles level skips by treating the deeper heading as a child of the closest ancestor', () => {
    const blocks: Block[] = [
      heading(2, 'setup'),
      heading(4, 'deep'),
    ];
    prefixHeadingIds(blocks);
    expect(ids(blocks)).toEqual([
      'setup',
      'setup-deep',
    ]);
  });
});
