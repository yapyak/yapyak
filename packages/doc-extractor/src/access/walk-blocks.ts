import type { Block } from '../types/blocks.ts';

export function walkBlocks(
  block: Block | Block[],
  visit: (block: Block) => void,
): void {
  if (Array.isArray(block)) {
    for (const item of block) {
      walkBlocks(item, visit);
    }
    return;
  }
  visit(block);

  if ('children' in block && Array.isArray(block.children)) {
    for (const child of block.children) {
      walkBlocks(child, visit);
    }
  }

  if (block.type === 'table') {
    if (block.head !== null) {
      walkBlocks(block.head, visit);
    }
    walkBlocks(block.body, visit);
  }

  if (block.type === 'code-group') {
    walkBlocks(block.tabs, visit);
  }
}
