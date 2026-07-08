declare module 'virtual:doc-compiler' {
  import type {
    AdjacentPages,
    Entry,
    GetHeadingsOptions,
    Heading,
    NavigationManifest,
    OptionsGroup,
    OptionsRegistry,
    Page,
    PageMeta,
    SidebarNode,
  } from '@yapyak/doc-compiler';

  export const doc: {
    getAdjacentPages(page: PageMeta): AdjacentPages;
    getEntry(collection: string, path?: string): Promise<Entry>;
    getFirstPageMeta(collection: string): PageMeta | undefined;
    getHeadings(page: Page, options?: GetHeadingsOptions): Heading[];
    getOptionsRegistry(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | undefined;
    getSidebarNodes(collection: string): SidebarNode[];
    manifest: NavigationManifest;
  };
}
