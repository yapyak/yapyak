declare module 'virtual:doc-extractor' {
  import type {
    AdjacentPages,
    Block,
    CodeBlock,
    Collection,
    GetExcerptOptions,
    GetHeadingsOptions,
    HeadingEntry,
    InternalLinkEntry,
    LoadResult,
    Manifest,
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
    getExcerpt(page: Page, options?: GetExcerptOptions): string;
    getHeadings(page: Page, options?: GetHeadingsOptions): HeadingEntry[];
    getInternalLinks(page: Page): InternalLinkEntry[];
    getPage(collection: string, path?: string): Page | null;
    getSidebar(collection: string): SidebarNode[];
    getText(page: Page): string;
    isBlock(value: unknown): value is Block;
    manifest: Manifest;
    resolvePath(collection: string, path?: string): LoadResult;
    resolveSymbol(name: string): SymbolEntry | null;
    walkBlocks(block: Block | Block[], visit: (block: Block) => void): void;
  };
}
