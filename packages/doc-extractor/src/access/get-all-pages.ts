import type { Manifest, Page } from '../types/manifest.ts';

export interface PageEntry {
  collection: string;
  page: Page;
  path: string;
}

export function* getAllPages(manifest: Manifest): Iterable<PageEntry> {
  for (const [collection, collectionData] of Object.entries(
    manifest.collections,
  )) {
    for (const [path, page] of Object.entries(collectionData.pages)) {
      yield { collection, page, path };
    }
  }
}
