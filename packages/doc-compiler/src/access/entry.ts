import type { Manifest, Page } from '../build';

export type Entry =
  | {
      kind: 'page';
      page: Page;
    }
  | {
      kind: 'redirect';
      target: string;
    }
  | {
      kind: 'not-found';
    };

export function getEntry(
  manifest: Manifest,
  collectionName: string,
  path = '',
): Entry {
  const collection = manifest.collections[collectionName];
  if (!collection) {
    return {
      kind: 'not-found',
    };
  }

  const page = collection.pages[path];
  if (page) {
    return {
      kind: 'page',
      page,
    };
  }

  const redirect = collection.redirects[path];
  if (redirect) {
    return {
      kind: 'redirect',
      target: redirect,
    };
  }

  return {
    kind: 'not-found',
  };
}
