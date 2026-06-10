import type { Page } from '../build';
import type { HeadingBlock } from './block';

import { blockToText } from './text';

export type HeadingEntry = {
  id: string;
  level: HeadingBlock['level'];
  text: string;
};

export type GetHeadingsOptions = {
  maxLevel?: number;
  minLevel?: number;
};

export function getHeadings(
  page: Page,
  options: GetHeadingsOptions = {},
): HeadingEntry[] {
  const minLevel = options.minLevel ?? 1;
  const maxLevel = options.maxLevel ?? 6;
  const result: HeadingEntry[] = [];
  for (const block of page.blocks) {
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
  return result;
}
