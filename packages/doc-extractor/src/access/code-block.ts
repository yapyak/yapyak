import type { CodeBlock } from '../types/block.ts';
import type { Page } from '../types/manifest.ts';

import { walkBlocks } from './block.ts';

export function getCodeBlocks(page: Page): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  for (const block of page.blocks) {
    walkBlocks(block, (current) => {
      if (current.type === 'code-block') {
        blocks.push(current);
      }
    });
  }
  return blocks;
}
