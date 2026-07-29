import type { NavigationManifest, Page } from '../build';
import type { Block } from './block';

export type Entry =
  | {
      kind: 'page';
      page: Page;
      blocks: Block[];
    }
  | {
      kind: 'redirect';
      target: string;
    }
  | {
      kind: 'not-found';
    };

export type EntryMeta =
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

export function getEntryMeta(
  manifest: NavigationManifest,
  collectionName: string,
  path = '',
): EntryMeta {
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
