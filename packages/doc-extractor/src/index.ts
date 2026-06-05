/**
 * Doc extractor for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/doc-extractor
 * # or
 * pnpm add @yapyak/doc-extractor
 * ```
 *
 * @packageDocumentation
 */

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
  OnlyBlock,
  ParagraphBlock,
  QuoteBlock,
  StrikethroughBlock,
  StrongBlock,
  SwitchBlock,
  TableBlock,
  TableCellBlock,
  TableRowBlock,
  TextBlock,
} from './access/block';
export type { Entry } from './access/entry';
export type { GetExcerptOptions } from './access/excerpt';
export type {
  GetHeadingsOptions,
  HeadingEntry,
} from './access/heading';
export type { InternalLinkEntry } from './access/internal-link';
export type { AdjacentPages, PageEntry } from './access/page';
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
} from './build/manifest';
export type {
  CollectionConfig,
  Config,
  MarkdocSource,
  OptionItem,
  OptionsGroup,
  OptionsRegistry,
  SourceUrlConfig,
  TypedocSource,
} from './config';

export { getCodeBlocks } from './access/code-block';
export { getCollection } from './access/collection';
export { getEntry } from './access/entry';
export { getExcerpt } from './access/excerpt';
export { getHeadings } from './access/heading';
export { getInternalLinks } from './access/internal-link';
export { getOptions, getOptionsGroup } from './access/options';
export { findAdjacentPages, getFirstPage, getPage } from './access/page';
export { getSidebar } from './access/sidebar';
export { resolveSymbol } from './access/symbol';
