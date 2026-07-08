import type { Block, HeadingBlock } from './block';

import { blockToText } from './text';

export type Anchor = {
  id: string;
  level: HeadingBlock['level'];
  text: string;
};

export type GetAnchorsOptions = {
  maxLevel?: number;
  minLevel?: number;
};

export function getAnchors(
  blocks: Block[],
  options: GetAnchorsOptions = {},
): Anchor[] {
  const minLevel = options.minLevel ?? 1;
  const maxLevel = options.maxLevel ?? 6;
  const result: Anchor[] = [];
  for (const block of blocks) {
    if (
      block.kind === 'heading' &&
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
