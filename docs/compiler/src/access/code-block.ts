import type { Block, CodeBlock } from './block';

import { walkBlocks } from './block';

export function getCodeBlocks(blocks: Block[]): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  for (const block of blocks) {
    walkBlocks(block, (current) => {
      if (current.kind === 'code-block') {
        codeBlocks.push(current);
      }
    });
  }
  return codeBlocks;
}
