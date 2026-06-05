import type { CodeBlock } from '../access/block';
import type { Page } from '../build/manifest';

import { walkBlocks } from './block';

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
