export type SidebarNode = SidebarGroup | SidebarLink;

export interface SidebarGroup {
  href?: string;
  items: SidebarNode[];
  title: string;
  type: 'group';
}

export interface SidebarLink {
  href: string;
  title: string;
  type: 'link';
}
