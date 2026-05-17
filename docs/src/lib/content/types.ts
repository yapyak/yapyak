export type Block =
  | BlockquoteBlock
  | CalloutBlock
  | CodeBlock
  | CodeGroupBlock
  | EmphasisBlock
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
  | TableHeaderCellBlock
  | TableRowBlock
  | TextBlock
  | ThematicBreakBlock;

export interface TextBlock {
  type: 'text';
  value: string;
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  children: Block[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  children: Block[];
}

export interface LinkBlock {
  type: 'link';
  href: string;
  children: Block[];
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string | null;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  children: ListItemBlock[];
}

export interface ListItemBlock {
  type: 'list-item';
  children: Block[];
}

export interface EmphasisBlock {
  type: 'emphasis';
  children: Block[];
}

export interface StrongBlock {
  type: 'strong';
  children: Block[];
}

export interface StrikethroughBlock {
  type: 'strikethrough';
  children: Block[];
}

export interface InlineCodeBlock {
  type: 'inline-code';
  value: string;
}

export interface BlockquoteBlock {
  type: 'blockquote';
  children: Block[];
}

export interface ThematicBreakBlock {
  type: 'thematic-break';
}

export interface LineBreakBlock {
  type: 'line-break';
}

export interface TableBlock {
  type: 'table';
  head: TableRowBlock | null;
  body: TableRowBlock[];
}

export interface TableRowBlock {
  type: 'table-row';
  children: (TableCellBlock | TableHeaderCellBlock)[];
}

export interface TableHeaderCellBlock {
  type: 'table-header-cell';
  children: Block[];
}

export interface TableCellBlock {
  type: 'table-cell';
  children: Block[];
}

export interface CodeBlock {
  type: 'code-block';
  label: string | null;
  language: string | null;
  source: string;
}

export interface CodeGroupBlock {
  type: 'code-group';
  tabs: CodeBlock[];
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'danger' | 'info' | 'tip' | 'warning';
  title: string | null;
  children: Block[];
}

export interface Page {
  blocks: Block[];
  description: string;
  title: string;
}
