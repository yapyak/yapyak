declare module 'virtual:doc-compiler' {
  import type {
    AdjacentPages,
    Entry,
    GetHeadingsOptions,
    HeadingEntry,
    NavigationManifest,
    OptionsGroup,
    OptionsRegistry,
    Page,
    PageMeta,
    SidebarNode,
  } from '@yapyak/doc-compiler';

  export const doc: {
    findAdjacentPages(page: PageMeta): AdjacentPages;
    getEntry(collection: string, path?: string): Promise<Entry>;
    getFirstPage(collection: string): PageMeta | undefined;
    getHeadings(page: Page, options?: GetHeadingsOptions): HeadingEntry[];
    getOptions(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | undefined;
    getSidebar(collection: string): SidebarNode[];
    manifest: NavigationManifest;
  };
}
