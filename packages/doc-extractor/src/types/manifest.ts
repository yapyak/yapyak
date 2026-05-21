import type { Block } from './blocks.ts';

export type MetaValue =
  | string
  | number
  | boolean
  | null
  | MetaValue[]
  | { [key: string]: MetaValue };

export interface Page {
  blocks: Block[];
  description: string;
  href: string;
  meta: Record<string, MetaValue>;
  title: string;
}

export interface Manifest {
  collections: Record<string, Collection>;
  symbols: Record<string, SymbolEntry>;
  version: 1;
}

export interface Collection {
  pages: Record<string, Page>;
  redirects: Record<string, string>;
  sidebar: SidebarNode[];
}

export interface SymbolEntry {
  collection: string;
  path: string;
}

export type SidebarNode = SidebarGroup | SidebarLink;

export interface SidebarBadge {
  text?: string;
  variant: 'deprecated' | 'kind';
}

export interface SidebarGroup {
  badge?: SidebarBadge;
  children: SidebarNode[];
  collapsible: boolean;
  href?: string;
  label: string;
  type: 'group';
}

export interface SidebarLink {
  badge?: SidebarBadge;
  href: string;
  label: string;
  type: 'link';
}
