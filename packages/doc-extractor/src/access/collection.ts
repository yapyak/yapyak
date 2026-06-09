import type { Collection, Manifest } from '../build';

export function getCollection(
  manifest: Manifest,
  collection: string,
): Collection | null {
  return manifest.collections[collection] ?? null;
}
