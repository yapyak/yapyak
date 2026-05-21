import type { Block } from '../types/blocks.ts';

const BLOCK_TYPES = new Set<Block['type']>([
  'blockquote',
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
