/**
 * Doc extractor for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/doc-compiler
 * ```
 *
 * @packageDocumentation
 */

export type {
  Anchor,
  Block,
  CalloutBlock,
  CodeBlock,
  CodeExpressionBlock,
  CodeLocationBlock,
  DiagnosticBlock,
  DiagnosticLine,
  DiagnosticStatus,
  DividerBlock,
  EmphasisBlock,
  Entry,
  EntryMeta,
  ExportKind,
  EyebrowBlock,
  GetAnchorsOptions,
  GetExcerptOptions,
  HeadingBlock,
  ImageBlock,
  InlineCodeBlock,
  InstallationWizardBlock,
  InternalLinkEntry,
  KindBadgeBlock,
  LineBreakBlock,
  LinkBlock,
  ListBlock,
  ListItemBlock,
  OnlyBlock,
  OutputBlock,
  OutputLine,
  PageEntry,
  Pagination,
  ParagraphBlock,
  PickerBlock,
  QuoteBlock,
  StrikethroughBlock,
  StrongBlock,
  SwitchBlock,
  TableBlock,
  TableCellBlock,
  TableCellColumn,
  TableRowBlock,
  TerminalBlock,
  TerminalLine,
  TerminalSegment,
  TerminalSegmentKind,
  TextBlock,
} from './access';
export type {
  Collection,
  Manifest,
  MetaValue,
  NavigationCollection,
  NavigationManifest,
  Page,
  SearchData,
  SearchEntry,
  SidebarBadge,
  SidebarGroupNode,
  SidebarLinkNode,
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
  blocksToMarkdown,
  getAnchors,
  getCodeBlocks,
  getCollection,
  getEntryMeta,
  getExcerpt,
  getFirstPage,
  getInternalLinks,
  getOptionsGroup,
  getOptionsRegistry,
  getPage,
  getPagination,
  getSidebarNodes,
  getText,
  resolveSymbol,
} from './access';
