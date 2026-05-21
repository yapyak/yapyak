import type { Manifest, Page } from '../types/manifest.ts';

export function getPage(
  manifest: Manifest,
  collection: string,
  path = '',
): Page | null {
  return manifest.collections[collection]?.pages[path] ?? null;
}
