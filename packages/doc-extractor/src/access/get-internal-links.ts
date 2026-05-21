import type { Page } from '../types/manifest.ts';

import { blockToText } from './block-to-text.ts';
import { walkBlocks } from './walk-blocks.ts';

export interface InternalLinkEntry {
  href: string;
  text: string;
}

export function getInternalLinks(page: Page): InternalLinkEntry[] {
  const links: InternalLinkEntry[] = [];
  for (const block of page.blocks) {
    walkBlocks(block, (current) => {
      if (current.type === 'link' && current.kind === 'internal') {
        links.push({
          href: current.href,
          text: current.children.map((child) => blockToText(child)).join(''),
        });
      }
    });
  }
  return links;
}
