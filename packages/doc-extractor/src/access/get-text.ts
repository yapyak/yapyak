import type { Page } from '../types/manifest.ts';

import { blockToText } from './block-to-text.ts';

export function getText(page: Page): string {
  return page.blocks
    .map((block) => blockToText(block))
    .filter((text) => text.length > 0)
    .join('\n');
}
