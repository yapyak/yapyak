declare module 'virtual:doc-compiler' {
  import type {
    Entry,
    GetHeadingsOptions,
    Heading,
    NavigationManifest,
    OptionsGroup,
    OptionsRegistry,
    Page,
    PageMeta,
    Pagination,
    SidebarNode,
  } from '@yapyak/doc-compiler';

  export const doc: {
    getEntry(collection: string, path?: string): Promise<Entry>;
    getFirstPageMeta(collection: string): PageMeta | undefined;
    getHeadings(page: Page, options?: GetHeadingsOptions): Heading[];
    getOptionsRegistry(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | undefined;
    getPagination(pageMeta: PageMeta): Pagination;
    getSidebarNodes(collection: string): SidebarNode[];
    manifest: NavigationManifest;
  };
}
