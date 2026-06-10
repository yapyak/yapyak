declare module 'virtual:doc-extractor' {
  import type {
    AdjacentPages,
    Entry,
    GetHeadingsOptions,
    HeadingEntry,
    Manifest,
    OptionsGroup,
    OptionsRegistry,
    Page,
    SidebarNode,
  } from '@yapyak/doc-extractor';

  export const doc: {
    findAdjacentPages(page: Page): AdjacentPages;
    getEntry(collection: string, path?: string): Entry;
    getFirstPage(collection: string): Page | undefined;
    getHeadings(page: Page, options?: GetHeadingsOptions): HeadingEntry[];
    getOptions(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | undefined;
    getSidebar(collection: string): SidebarNode[];
    manifest: Manifest;
  };
}
