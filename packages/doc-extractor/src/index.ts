export type {
  GetExcerptOptions,
} from './access/excerpt.ts';
export type {
  GetHeadingsOptions,
  HeadingEntry,
} from './access/heading.ts';
export type { InternalLinkEntry } from './access/internal-link.ts';
export type { PageEntry } from './access/page.ts';
export type {
  AdjacentPages,
  Entry,
} from './types/access.ts';
export type {
  Block,
  CalloutBlock,
  CodeBlock,
  CodeGroupBlock,
  CodeLocationBlock,
  DividerBlock,
  EmphasisBlock,
  ExportKind,
  EyebrowBlock,
  HeadingBlock,
  ImageBlock,
  InlineCodeBlock,
  LineBreakBlock,
  LinkBlock,
  ListBlock,
  ListItemBlock,
  ParagraphBlock,
  QuoteBlock,
  StrikethroughBlock,
  StrongBlock,
  TableBlock,
  TableCellBlock,
  TableRowBlock,
  TextBlock,
} from './types/block.ts';
export type {
  CollectionConfig,
  Config,
  MarkdocSource,
  TypedocSource,
} from './types/config.ts';
export type {
  Collection,
  Manifest,
  MetaValue,
  Page,
  SidebarBadge,
  SidebarGroup,
  SidebarLink,
  SidebarNode,
  SymbolEntry,
} from './types/manifest.ts';

export { getCodeBlocks } from './access/code-block.ts';
export { getCollection } from './access/collection.ts';
export { getEntry } from './access/entry.ts';
export { getExcerpt } from './access/excerpt.ts';
export { getHeadings } from './access/heading.ts';
export { getInternalLinks } from './access/internal-link.ts';
export { isBlock, walkBlocks } from './access/block.ts';
export {
  findAdjacentPages,
  getAllPages,
  getFirstPage,
  getPage,
} from './access/page.ts';
export { resolveSymbol } from './access/symbol.ts';
export { getSidebar } from './access/sidebar.ts';
export { blockToText, getText } from './access/text.ts';
