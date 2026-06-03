export type Block =
  | QuoteBlock
  | CalloutBlock
  | CodeBlock
  | CodeGroupBlock
  | CodeLocationBlock
  | DividerBlock
  | EmphasisBlock
  | EyebrowBlock
  | HeadingBlock
  | ImageBlock
  | InlineCodeBlock
  | LineBreakBlock
  | LinkBlock
  | ListBlock
  | ListItemBlock
  | ParagraphBlock
  | StrikethroughBlock
  | StrongBlock
  | TableBlock
  | TableCellBlock
  | TableRowBlock
  | TextBlock;

export interface TextBlock {
  type: 'text';
  value: string;
}

export interface HeadingBlock {
  children: Block[];
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  type: 'heading';
}

export interface ParagraphBlock {
  children: Block[];
  type: 'paragraph';
}

export interface LinkBlock {
  children: Block[];
  href: string;
  kind: 'external' | 'internal';
  type: 'link';
}

export interface ImageBlock {
  alt: string | null;
  src: string;
  type: 'image';
}

export interface ListBlock {
  children: ListItemBlock[];
  ordered: boolean;
  type: 'list';
}

export interface ListItemBlock {
  children: Block[];
  type: 'list-item';
}

export interface EmphasisBlock {
  children: Block[];
  type: 'emphasis';
}

export interface StrongBlock {
  children: Block[];
  type: 'strong';
}

export interface StrikethroughBlock {
  children: Block[];
  type: 'strikethrough';
}

export interface InlineCodeBlock {
  type: 'inline-code';
  value: string;
}

export interface QuoteBlock {
  children: Block[];
  type: 'quote';
}

export interface DividerBlock {
  type: 'divider';
}

export interface LineBreakBlock {
  type: 'line-break';
}

export interface TableBlock {
  body: TableRowBlock[];
  head: TableRowBlock | null;
  type: 'table';
}

export interface TableRowBlock {
  children: TableCellBlock[];
  type: 'table-row';
}

export interface TableCellBlock {
  children: Block[];
  header: boolean;
  type: 'table-cell';
}

export interface CodeBlock {
  label: string | null;
  language: string | null;
  source: string;
  type: 'code-block';
}

export interface CodeGroupBlock {
  tabs: CodeBlock[];
  type: 'code-group';
}

export interface CalloutBlock {
  children: Block[];
  title: string | null;
  type: 'callout';
  variant: 'danger' | 'info' | 'tip' | 'warning';
}

export type ExportKind =
  | 'class'
  | 'function'
  | 'interface'
  | 'type'
  | 'variable';

export interface EyebrowBlock {
  kind: ExportKind | null;
  module: string | null;
  sourceHref: string | null;
  type: 'eyebrow';
}

export interface CodeLocationBlock {
  file: string;
  href: string | null;
  line: number;
  type: 'code-location';
}

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
