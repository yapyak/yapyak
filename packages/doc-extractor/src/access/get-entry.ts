import type { Entry } from '../types/access.ts';
import type { Manifest } from '../types/manifest.ts';

export function getEntry(
  manifest: Manifest,
  collection: string,
  path = '',
): Entry {
  const collectionData = manifest.collections[collection];
  if (collectionData === undefined) {
    return { kind: 'not-found' };
  }

  const page = collectionData.pages[path];
  if (page !== undefined) {
    return { kind: 'page', page };
  }

  const redirect = collectionData.redirects[path];
  if (redirect !== undefined) {
    return { kind: 'redirect', target: redirect };
  }

  return { kind: 'not-found' };
}
