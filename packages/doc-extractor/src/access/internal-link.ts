import type { Page } from '../build/manifest.ts';

import { walkBlocks } from './block.ts';
import { blockToText } from './text.ts';

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
          text: current.children.map(blockToText).join(''),
        });
      }
    });
  }
  return links;
}
