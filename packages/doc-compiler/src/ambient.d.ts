declare module 'virtual:doc-compiler' {
  import type {
    Entry,
    GetHeadingsOptions,
    Heading,
    NavigationManifest,
    OptionsGroup,
    OptionsRegistry,
    Page,
    Pagination,
    SidebarNode,
  } from '@yapyak/doc-compiler';

  export const doc: {
    getEntry(collection: string, path?: string): Promise<Entry>;
    getFirstPage(collection: string): Page | undefined;
    getHeadings(page: Page, options?: GetHeadingsOptions): Heading[];
    getOptionsRegistry(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | undefined;
    getPagination(page: Page): Pagination;
    getSidebarNodes(collection: string): SidebarNode[];
    manifest: NavigationManifest;
  };
}
