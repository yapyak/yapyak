import type { Block } from './block';

import { walkBlocks } from './block';
import { blockToText } from './text';

export type InternalLinkEntry = {
  href: string;
  text: string;
};

export function getInternalLinks(blocks: Block[]): InternalLinkEntry[] {
  const links: InternalLinkEntry[] = [];
  for (const block of blocks) {
    walkBlocks(block, (current) => {
      if (current.kind === 'link' && current.linkKind === 'internal') {
        links.push({
          href: current.href,
          text: current.children.map(blockToText).join(''),
        });
      }
    });
  }
  return links;
}
