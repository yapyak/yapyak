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

export interface BlockquoteBlock {
  children: Block[];
  type: 'blockquote';
}

export interface ThematicBreakBlock {
  type: 'thematic-break';
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
  children: (TableCellBlock | TableHeaderCellBlock)[];
  type: 'table-row';
}

export interface TableHeaderCellBlock {
  children: Block[];
  type: 'table-header-cell';
}

export interface TableCellBlock {
  children: Block[];
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

export interface Page {
  blocks: Block[];
  description: string;
  title: string;
}
