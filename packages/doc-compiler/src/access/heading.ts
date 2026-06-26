import type { Page } from '../build';
import type { Block, HeadingBlock } from './block';

import { blockToText } from './text';

export type SwitchContext = {
  group: string;
  value: string;
};

export type HeadingEntry = {
  id: string;
  level: HeadingBlock['level'];
  switchContexts: SwitchContext[];
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
  return collectHeadings(page.blocks, [], minLevel, maxLevel);
}

function collectHeadings(
  blocks: Block[],
  switchContexts: SwitchContext[],
  minLevel: number,
  maxLevel: number,
): HeadingEntry[] {
  return blocks.flatMap((block) => {
    if (block.type === 'heading') {
      if (block.level < minLevel || block.level > maxLevel) {
        return [];
      }
      return [
        {
          id: block.id,
          level: block.level,
          switchContexts,
          text: block.children.map(blockToText).join(''),
        },
      ];
    }
    if (block.type === 'switch') {
      return Object.entries(block.branches).flatMap(([value, branch]) =>
        collectHeadings(
          branch,
          [
            ...switchContexts,
            {
              group: block.group,
              value,
            },
          ],
          minLevel,
          maxLevel,
        ),
      );
    }
    return [];
  });
}
