import type { Collection, Manifest } from '../build';

export function getCollection(
  manifest: Manifest,
  collection: string,
): Collection | undefined {
  return manifest.collections[collection];
}
