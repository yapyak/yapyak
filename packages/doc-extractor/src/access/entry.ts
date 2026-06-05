import type { Manifest, Page } from '../build/manifest';

export type Entry =
  | { kind: 'page'; page: Page }
  | { kind: 'redirect'; target: string }
  | { kind: 'not-found' };

export function getEntry(
  manifest: Manifest,
  collection: string,
  path = '',
): Entry {
  const collectionData = manifest.collections[collection];
  if (!collectionData) {
    return { kind: 'not-found' };
  }

  const page = collectionData.pages[path];
  if (page) {
    return { kind: 'page', page };
  }

  const redirect = collectionData.redirects[path];
  if (redirect) {
    return { kind: 'redirect', target: redirect };
  }

  return { kind: 'not-found' };
}
