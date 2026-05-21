import type { Page, SidebarLink } from './manifest.ts';

export type LoadResult =
  | { kind: 'page'; page: Page }
  | { kind: 'redirect'; target: string }
  | { kind: 'not-found' };

export interface AdjacentPages {
  next: SidebarLink | null;
  previous: SidebarLink | null;
}
