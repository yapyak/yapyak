import type { Manifest, Page } from '../build';

import { describe, expect, it } from 'vitest';

import { getEntry } from './entry';

const PAGE: Page = {
  blocks: [],
  description: '',
  href: '/guide/settings',
  meta: {},
  title: 'Settings',
};

function manifest(collections: Manifest['collections']): Manifest {
  return {
    collections,
    options: {},
    symbols: {},
    version: 1,
  };
}

describe('getEntry', () => {
  it('returns a `page` entry when the path resolves to a page', () => {
    expect(
      getEntry(
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
      getEntry(
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
    expect(getEntry(manifest({}), 'missing', 'settings')).toEqual({
      kind: 'not-found',
    });
  });

  it('returns a `not-found` entry when the path is missing', () => {
    expect(
      getEntry(
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
