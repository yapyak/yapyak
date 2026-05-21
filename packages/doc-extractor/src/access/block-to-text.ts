import type { Block } from '../types/blocks.ts';

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
    case 'blockquote':
    case 'list-item':
    case 'callout':
      return block.children.map((child) => blockToText(child)).join('');
    case 'list':
      return block.children.map((child) => blockToText(child)).join('\n');
    case 'code-block':
      return block.source;
    case 'code-group':
      return block.tabs.map((tab) => tab.source).join('\n\n');
    case 'table': {
      const rows =
        block.head !== null ? [block.head, ...block.body] : block.body;
      return rows
        .map((row) => row.children.map((cell) => blockToText(cell)).join(' | '))
        .join('\n');
    }
    case 'table-row':
      return block.children.map((cell) => blockToText(cell)).join(' | ');
    case 'table-cell':
      return block.children.map((child) => blockToText(child)).join('');
    case 'image':
      return block.alt ?? '';
    case 'eyebrow':
      return block.kind;
    case 'code-location':
      return `${block.file}:${block.line}`;
    case 'divider':
    case 'line-break':
      return '';
  }
}
