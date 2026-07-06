import type { NavigationManifest, PageMeta } from '../build';

import { describe, expect, it } from 'vitest';

import { getEntryMeta } from './entry';

const PAGE: PageMeta = {
  description: '',
  href: '/guide/settings',
  meta: {},
  title: 'Settings',
};

function manifest(
  collections: NavigationManifest['collections'],
): NavigationManifest {
  return {
    collections,
    options: {},
    symbols: {},
    version: 1,
  };
}

describe('getEntryMeta', () => {
  it('returns a `page` entry when the path resolves to a page', () => {
    expect(
      getEntryMeta(
        manifest({
          guide: {
            pages: {
              settings: PAGE,
            },
            redirects: {},
            sidebar: [],
          },
        }),
        'guide',
        'settings',
      ),
    ).toEqual({
      kind: 'page',
      page: PAGE,
    });
  });

  it('returns a `redirect` entry when the path resolves to a redirect', () => {
    expect(
      getEntryMeta(
        manifest({
          guide: {
            pages: {},
            redirects: {
              old: '/guide/settings',
            },
            sidebar: [],
          },
        }),
        'guide',
        'old',
      ),
    ).toEqual({
      kind: 'redirect',
      target: '/guide/settings',
    });
  });

  it('returns a `not-found` entry when the collection is missing', () => {
    expect(getEntryMeta(manifest({}), 'missing', 'settings')).toEqual({
      kind: 'not-found',
    });
  });

  it('returns a `not-found` entry when the path is missing', () => {
    expect(
      getEntryMeta(
        manifest({
          guide: {
            pages: {},
            redirects: {},
            sidebar: [],
          },
        }),
        'guide',
        'settings',
      ),
    ).toEqual({
      kind: 'not-found',
    });
  });
});
