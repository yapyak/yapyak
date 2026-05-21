import type { Collection, Manifest } from '../types/manifest.ts';

export function getCollection(
  manifest: Manifest,
  collection: string,
): Collection | null {
  return manifest.collections[collection] ?? null;
}
