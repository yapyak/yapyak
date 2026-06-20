/**
 * Doc extractor for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/doc-compiler
 * # or
 * pnpm add @yapyak/doc-compiler
 * ```
 *
 * @packageDocumentation
 */

export type {
  AdjacentPages,
  Block,
  CalloutBlock,
  CodeBlock,
  CodeExpressionBlock,
  CodeLocationBlock,
  DiagnosticsBlock,
  DiagnosticsLine,
  DiagnosticsStatus,
  DividerBlock,
  EmphasisBlock,
  Entry,
  ExportKind,
  EyebrowBlock,
  GetExcerptOptions,
  GetHeadingsOptions,
  HeadingBlock,
  HeadingEntry,
  ImageBlock,
  InlineCodeBlock,
  InternalLinkEntry,
  LineBreakBlock,
  LinkBlock,
  ListBlock,
  ListItemBlock,
  OnlyBlock,
  OutputBlock,
  OutputLine,
  PageEntry,
  ParagraphBlock,
  PickerBlock,
  QuoteBlock,
  StrikethroughBlock,
  StrongBlock,
  SwitchBlock,
  TableBlock,
  TableCellBlock,
  TableRowBlock,
  TextBlock,
} from './access';
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
} from './build';
export type {
  CollectionConfig,
  Config,
  MarkdownSource,
  OptionItem,
  OptionsGroup,
  OptionsRegistry,
  SourceUrlConfig,
  Supplement,
  TypeScriptSource,
} from './config';

export {
  findAdjacentPages,
  getCodeBlocks,
  getCollection,
  getEntry,
  getExcerpt,
  getFirstPage,
  getHeadings,
  getInternalLinks,
  getOptions,
  getOptionsGroup,
  getPage,
  getSidebar,
  getText,
  resolveSymbol,
} from './access';
