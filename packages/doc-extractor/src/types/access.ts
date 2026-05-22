import type { Page } from './manifest.ts';

export type Entry =
  | { kind: 'page'; page: Page }
  | { kind: 'redirect'; target: string }
  | { kind: 'not-found' };

export interface AdjacentPages {
  nextPage: Page | null;
  previousPage: Page | null;
}
