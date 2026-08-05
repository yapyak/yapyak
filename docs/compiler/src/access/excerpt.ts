import type { Block } from './block';

import { blockToText } from './text';

export type GetExcerptOptions = {
  maxLength?: number;
};

export function getExcerpt(
  blocks: Block[],
  options: GetExcerptOptions = {},
): string {
  const maxLength = options.maxLength ?? 160;
  for (const block of blocks) {
    if (block.kind !== 'paragraph') {
      continue;
    }
    const text = blockToText(block).trim();
    if (text.length === 0) {
      continue;
    }
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
  }
  return '';
}
