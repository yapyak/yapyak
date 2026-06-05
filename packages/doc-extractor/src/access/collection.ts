import type { Collection, Manifest } from '../build/manifest';

export function getCollection(
  manifest: Manifest,
  collection: string,
): Collection | null {
  return manifest.collections[collection] ?? null;
}
