import type { Block } from '../access/block';
import type { Page } from '../build/manifest';

export function getText(page: Page): string {
  return page.blocks
    .map(blockToText)
    .filter((text) => text.length > 0)
    .join('\n');
}

export function blockToText(block: Block): string {
  switch (block.type) {
    case 'text':
    case 'inline-code':
      return block.value;
    case 'heading':
    case 'paragraph':
    case 'link':
    case 'emphasis':
    case 'strong':
    case 'strikethrough':
    case 'quote':
    case 'list-item':
    case 'callout':
      return block.children.map(blockToText).join('');
    case 'list':
      return block.children.map(blockToText).join('\n');
    case 'code-block':
      return block.source;
    case 'code-group':
      return block.tabs.map((tab) => tab.source).join('\n\n');
    case 'switch':
      return Object.values(block.branches)
        .map((branchBlocks) => branchBlocks.map(blockToText).join(''))
        .join('\n\n');
    case 'only':
      return block.children.map(blockToText).join('');
    case 'table': {
      const rows =
        block.head === null ? block.body : [block.head, ...block.body];
      return rows
        .map((row) => row.children.map(blockToText).join(' | '))
        .join('\n');
    }
    case 'table-row':
      return block.children.map(blockToText).join(' | ');
    case 'table-cell':
      return block.children.map(blockToText).join('');
    case 'image':
      return block.alt ?? '';
    case 'eyebrow':
      return block.kind ?? block.module ?? '';
    case 'code-location':
      return `${block.file}:${block.line}`;
    case 'divider':
    case 'line-break':
      return '';
  }
}
