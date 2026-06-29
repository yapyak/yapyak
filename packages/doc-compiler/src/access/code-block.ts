import type { Page } from '../build';
import type { CodeBlock } from './block';

import { walkBlocks } from './block';

export function getCodeBlocks(page: Page): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  for (const block of page.blocks) {
    walkBlocks(block, (current) => {
      if (current.kind === 'code-block') {
        blocks.push(current);
      }
    });
  }
  return blocks;
}
