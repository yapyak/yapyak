declare module 'virtual:doc-compiler' {
  import type {
    Anchor,
    Block,
    Entry,
    GetAnchorsOptions,
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
    getAnchors(blocks: Block[], options?: GetAnchorsOptions): Anchor[];
    getOptionsRegistry(): OptionsRegistry;
    getOptionsGroup(groupId: string): OptionsGroup | undefined;
    getPagination(page: Page): Pagination;
    getSidebarNodes(collection: string): SidebarNode[];
    manifest: NavigationManifest;
  };
}
