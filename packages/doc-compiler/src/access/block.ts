export type Block =
  | QuoteBlock
  | CalloutBlock
  | CodeBlock
  | CodeExpressionBlock
  | CodeLocationBlock
  | DividerBlock
  | EmphasisBlock
  | EyebrowBlock
  | HeadingBlock
  | KindBadgeBlock
  | ImageBlock
  | InlineCodeBlock
  | LineBreakBlock
  | LinkBlock
  | ListBlock
  | ListItemBlock
  | DiagnosticsBlock
  | OnlyBlock
  | OutputBlock
  | ParagraphBlock
  | PickerBlock
  | StrikethroughBlock
  | StrongBlock
  | SwitchBlock
  | TableBlock
  | TableCellBlock
  | TableRowBlock
  | TerminalBlock
  | TextBlock;

export type TextBlock = {
  kind: 'text';
  value: string;
};

export type HeadingBlock = {
  children: Block[];
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  kind: 'heading';
};

export type ParagraphBlock = {
  children: Block[];
  kind: 'paragraph';
};

export type LinkBlock = {
  children: Block[];
  href: string;
  linkKind: 'external' | 'internal';
  kind: 'link';
};

export type ImageBlock = {
  alt: string | null;
  src: string;
  kind: 'image';
};

export type ListBlock = {
  children: ListItemBlock[];
  ordered: boolean;
  size?: 'lg' | 'md' | 'sm';
  kind: 'list';
};

export type ListItemBlock = {
  children: Block[];
  kind: 'list-item';
};

export type EmphasisBlock = {
  children: Block[];
  kind: 'emphasis';
};

export type StrongBlock = {
  children: Block[];
  kind: 'strong';
};

export type StrikethroughBlock = {
  children: Block[];
  kind: 'strikethrough';
};

export type InlineCodeBlock = {
  kind: 'inline-code';
  value: string;
};

export type QuoteBlock = {
  children: Block[];
  kind: 'quote';
};

export type DividerBlock = {
  kind: 'divider';
};

export type LineBreakBlock = {
  kind: 'line-break';
};

export type TableBlock = {
  body: TableRowBlock[];
  head: TableRowBlock | null;
  kind: 'table';
};

export type TableRowBlock = {
  children: TableCellBlock[];
  kind: 'table-row';
};

export type TableCellBlock = {
  children: Block[];
  column?: TableCellColumn;
  header: boolean;
  kind: 'table-cell';
};

export type TableCellColumn = 'identifier' | 'literal' | 'prose';

export type CodeBlock = {
  label: string | null;
  language: string | null;
  path: string | null;
  source: string;
  kind: 'code-block';
};

export type CodeExpressionBlock = {
  children: Block[];
  kind: 'code-expression';
};

export type SwitchBlock = {
  branches: Record<string, Block[]>;
  fallback?: Block[];
  group: string;
  kind: 'switch';
};

export type OnlyBlock = {
  children: Block[];
  group: string;
  kind: 'only';
  value: string;
};

export type PickerBlock = {
  group: string;
  kind: 'picker';
};

export type CalloutBlock = {
  children: Block[];
  title: string | null;
  kind: 'callout';
  variant: 'danger' | 'info' | 'tip' | 'warning';
};

export type OutputLine = {
  locale: string | null;
  value: string;
};

export type OutputBlock = {
  lines: OutputLine[];
  kind: 'output';
};

export type TerminalSegmentKind =
  | 'bar-empty'
  | 'bar-fill'
  | 'bold'
  | 'cyan'
  | 'dim'
  | 'green'
  | 'red'
  | 'text'
  | 'yellow';

export type TerminalSegment = {
  segmentKind: TerminalSegmentKind;
  kind: 'terminal-segment';
  value: string;
};

export type TerminalLine = {
  segments: TerminalSegment[];
  kind: 'terminal-line';
};

export type TerminalBlock = {
  lines: TerminalLine[];
  kind: 'terminal';
};

export type DiagnosticsStatus = 'error' | 'ok';

export type DiagnosticsLine = {
  code: string;
  message: string | null;
  status: DiagnosticsStatus;
};

export type DiagnosticsBlock = {
  language: string;
  lines: DiagnosticsLine[];
  kind: 'diagnostics';
};

export type ExportKind =
  | 'class'
  | 'component'
  | 'function'
  | 'hook'
  | 'interface'
  | 'type'
  | 'variable';

export type EyebrowBlock = {
  exportKind: ExportKind | null;
  module: string | null;
  sourceHref: string | null;
  kind: 'eyebrow';
};

export type KindBadgeBlock = {
  exportKind: ExportKind;
  kind: 'kind-badge';
};

export type CodeLocationBlock = {
  file: string;
  href: string | null;
  line: number;
  kind: 'code-location';
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

  if (block.kind === 'table') {
    if (block.head !== null) {
      walkBlocks(block.head, visit);
    }
    walkBlocks(block.body, visit);
  }

  if (block.kind === 'switch') {
    for (const branchBlocks of Object.values(block.branches)) {
      walkBlocks(branchBlocks, visit);
    }
  }
}
