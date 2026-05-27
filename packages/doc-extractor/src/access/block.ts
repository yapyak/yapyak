import type { Block } from '../types/block.ts';

const BLOCK_TYPES = new Set<Block['type']>([
  'quote',
  'callout',
  'code-block',
  'code-group',
  'code-location',
  'divider',
  'emphasis',
  'eyebrow',
  'heading',
  'image',
  'inline-code',
  'line-break',
  'link',
  'list',
  'list-item',
  'paragraph',
  'strikethrough',
  'strong',
  'table',
  'table-cell',
  'table-row',
  'text',
]);

export function isBlock(value: unknown): value is Block {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string' &&
    BLOCK_TYPES.has((value as { type: Block['type'] }).type)
  );
}

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
