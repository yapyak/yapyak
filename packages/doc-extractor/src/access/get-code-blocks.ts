import type { CodeBlock } from '../types/blocks.ts';
import type { Page } from '../types/manifest.ts';

import { walkBlocks } from './walk-blocks.ts';

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
