export type Block =
  | QuoteBlock
  | CalloutBlock
  | CodeBlock
  | CodeExpressionBlock
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
  | OnlyBlock
  | OutputBlock
  | ParagraphBlock
  | StrikethroughBlock
  | StrongBlock
  | SwitchBlock
  | TableBlock
  | TableCellBlock
  | TableRowBlock
  | TextBlock;

export type TextBlock = {
  type: 'text';
  value: string;
};

export type HeadingBlock = {
  children: Block[];
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  type: 'heading';
};

export type ParagraphBlock = {
  children: Block[];
  type: 'paragraph';
};

export type LinkBlock = {
  children: Block[];
  href: string;
  kind: 'external' | 'internal';
  type: 'link';
};

export type ImageBlock = {
  alt: string | null;
  src: string;
  type: 'image';
};

export type ListBlock = {
  children: ListItemBlock[];
  ordered: boolean;
  type: 'list';
};

export type ListItemBlock = {
  children: Block[];
  type: 'list-item';
};

export type EmphasisBlock = {
  children: Block[];
  type: 'emphasis';
};

export type StrongBlock = {
  children: Block[];
  type: 'strong';
};

export type StrikethroughBlock = {
  children: Block[];
  type: 'strikethrough';
};

export type InlineCodeBlock = {
  type: 'inline-code';
  value: string;
};

export type QuoteBlock = {
  children: Block[];
  type: 'quote';
};

export type DividerBlock = {
  type: 'divider';
};

export type LineBreakBlock = {
  type: 'line-break';
};

export type TableBlock = {
  body: TableRowBlock[];
  head: TableRowBlock | null;
  type: 'table';
};

export type TableRowBlock = {
  children: TableCellBlock[];
  type: 'table-row';
};

export type TableCellBlock = {
  children: Block[];
  header: boolean;
  type: 'table-cell';
};

export type CodeBlock = {
  label: string | null;
  language: string | null;
  path: string | null;
  source: string;
  type: 'code-block';
};

export type CodeExpressionBlock = {
  children: Block[];
  type: 'code-expression';
};

export type CodeGroupBlock = {
  tabs: CodeBlock[];
  type: 'code-group';
};

export type SwitchBlock = {
  branches: Record<string, Block[]>;
  group: string;
  type: 'switch';
};

export type OnlyBlock = {
  children: Block[];
  group: string;
  type: 'only';
  value: string;
};

export type CalloutBlock = {
  children: Block[];
  title: string | null;
  type: 'callout';
  variant: 'danger' | 'info' | 'tip' | 'warning';
};

export type OutputLine = {
  locale: string | null;
  value: string;
};

export type OutputBlock = {
  lines: OutputLine[];
  type: 'output';
};

export type ExportKind =
  | 'class'
  | 'function'
  | 'interface'
  | 'type'
  | 'variable';

export type EyebrowBlock = {
  kind: ExportKind | null;
  module: string | null;
  sourceHref: string | null;
  type: 'eyebrow';
};

export type CodeLocationBlock = {
  file: string;
  href: string | null;
  line: number;
  type: 'code-location';
};

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

  if (block.type === 'switch') {
    for (const branchBlocks of Object.values(block.branches)) {
      walkBlocks(branchBlocks, visit);
    }
  }
}
