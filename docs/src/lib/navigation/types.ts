export type NavNode = NavGroup | NavLink;

export interface NavGroup {
  badge?: NavBadge;
  children: NavNode[];
  collapsible: boolean;
  href?: string;
  label: string;
  type: 'group';
}

export interface NavLink {
  badge?: NavBadge;
  href: string;
  label: string;
  type: 'link';
}

export interface NavBadge {
  text?: string;
  variant: 'deprecated' | 'kind';
}

export interface NavAdjacent {
  href: string;
  label: string;
}

export interface NavPagination {
  next: NavAdjacent | null;
  previous: NavAdjacent | null;
}
