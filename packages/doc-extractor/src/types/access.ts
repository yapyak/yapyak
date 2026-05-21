import type { Page } from './manifest.ts';

export type LoadResult =
  | { kind: 'page'; page: Page }
  | { kind: 'redirect'; target: string }
  | { kind: 'not-found' };

export interface AdjacentPages {
  next: Page | null;
  previous: Page | null;
}
