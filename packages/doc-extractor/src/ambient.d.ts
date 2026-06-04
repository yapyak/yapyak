declare module 'virtual:doc-extractor' {
  import type {
    AdjacentPages,
    Block,
    CodeBlock,
    Collection,
    Entry,
    GetExcerptOptions,
    GetHeadingsOptions,
    HeadingEntry,
    InternalLinkEntry,
    Manifest,
    OptionsGroup,
    OptionsRegistry,
    Page,
    PageEntry,
    SidebarNode,
    SymbolEntry,
  } from '@yapyak/doc-extractor';

  export const doc: {
    blockToText(block: Block): string;
    findAdjacentPages(page: Page): AdjacentPages;
    getAllPages(): Iterable<PageEntry>;
    getCodeBlocks(page: Page): CodeBlock[];
    getCollection(collection: string): Collection | null;
    getEntry(collection: string, path?: string): Entry;
    getExcerpt(page: Page, options?: GetExcerptOptions): string;
    getFirstPage(collection: string): Page | null;
    getHeadings(page: Page, options?: GetHeadingsOptions): HeadingEntry[];
    getInternalLinks(page: Page): InternalLinkEntry[];
    getOptions(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | null;
    getPage(collection: string, path?: string): Page | null;
    getSidebar(collection: string): SidebarNode[];
    getText(page: Page): string;
    isBlock(value: unknown): value is Block;
    manifest: Manifest;
    resolveSymbol(name: string): SymbolEntry | null;
    walkBlocks(block: Block | Block[], visit: (block: Block) => void): void;
  };
}
