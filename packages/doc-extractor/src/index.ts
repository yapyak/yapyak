export type { PageEntry } from './access/get-all-pages.ts';
export type { GetExcerptOptions } from './access/get-excerpt.ts';
export type {
  GetHeadingsOptions,
  HeadingEntry,
} from './access/get-headings.ts';
export type { InternalLinkEntry } from './access/get-internal-links.ts';
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
  DocExtractorOptions,
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

export { blockToText } from './access/block-to-text.ts';
export { findAdjacentPages } from './access/find-adjacent.ts';
export { getAllPages } from './access/get-all-pages.ts';
export { getCodeBlocks } from './access/get-code-blocks.ts';
export { getCollection } from './access/get-collection.ts';
export { getEntry } from './access/get-entry.ts';
export { getExcerpt } from './access/get-excerpt.ts';
export { getFirstPage } from './access/get-first-page.ts';
export { getHeadings } from './access/get-headings.ts';
export { getInternalLinks } from './access/get-internal-links.ts';
export { getPage } from './access/get-page.ts';
export { getSidebar } from './access/get-sidebar.ts';
export { getText } from './access/get-text.ts';
export { isBlock } from './access/is-block.ts';
export { resolveSymbol } from './access/resolve-symbol.ts';
export { walkBlocks } from './access/walk-blocks.ts';
