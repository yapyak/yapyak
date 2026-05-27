import type { Page } from '../build/manifest.ts';

import { blockToText } from './text.ts';

export interface GetExcerptOptions {
  maxLength?: number;
}

export function getExcerpt(
  page: Page,
  options: GetExcerptOptions = {},
): string {
  const maxLength = options.maxLength ?? 160;
  for (const block of page.blocks) {
    if (block.type !== 'paragraph') {
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
