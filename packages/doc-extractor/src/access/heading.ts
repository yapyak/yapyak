import type { Block, HeadingBlock } from '../access/block.ts';
import type { Page } from '../build/manifest.ts';

import { blockToText } from './text.ts';

export interface HeadingEntry {
  id: string;
  level: HeadingBlock['level'];
  text: string;
}

export interface GetHeadingsOptions {
  maxLevel?: number;
  minLevel?: number;
}

export function getHeadings(
  page: Page,
  options: GetHeadingsOptions = {},
): HeadingEntry[] {
  const minLevel = options.minLevel ?? 1;
  const maxLevel = options.maxLevel ?? 6;
  const result: HeadingEntry[] = [];
  for (const block of page.blocks) {
    collect(block, minLevel, maxLevel, result);
  }
  return result;
}

function collect(
  block: Block,
  minLevel: number,
  maxLevel: number,
  result: HeadingEntry[],
) {
  if (
    block.type === 'heading' &&
    block.level >= minLevel &&
    block.level <= maxLevel
  ) {
    result.push({
      id: block.id,
      level: block.level,
      text: block.children.map(blockToText).join(''),
    });
  }
}
