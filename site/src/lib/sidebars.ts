export type SidebarNode = SidebarGroup | SidebarLink;

export interface SidebarGroup {
  type: 'group';
  title: string;
  href?: string;
  items: SidebarNode[];
  collapsed?: boolean;
}

export interface SidebarLink {
  type: 'link';
  title: string;
  href: string;
}
