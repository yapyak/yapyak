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
  AdjacentPages,
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
  GetExcerptOptions,
  GetHeadingsOptions,
  Heading,
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
  PageMeta,
  SearchData,
  SearchEntry,
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
  blocksToMarkdown,
  getAdjacentPages,
  getCodeBlocks,
  getCollection,
  getEntryMeta,
  getExcerpt,
  getFirstPageMeta,
  getHeadings,
  getInternalLinks,
  getOptionsGroup,
  getOptionsRegistry,
  getPage,
  getSidebarNodes,
  getText,
  resolveSymbol,
} from './access';
