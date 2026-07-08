import type { NavigationManifest, PageMeta, SidebarNode } from '../build';

import { describe, expect, it } from 'vitest';

import { getAdjacentPages, getFirstPageMeta, getPage } from './page';

const HELLO_PAGE: PageMeta = {
  breadcrumbs: [],
  description: '',
  href: '/guide/hello',
  meta: {},
  title: 'Hello',
};

const WORLD_PAGE: PageMeta = {
  breadcrumbs: [],
  description: '',
  href: '/guide/world',
  meta: {},
  title: 'World',
};

const SETTINGS_PAGE: PageMeta = {
  breadcrumbs: [],
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

function link(href: string, label: string): SidebarNode {
  return {
    href,
    kind: 'link',
    label,
  };
}

describe('getAdjacentPages', () => {
  it('returns the previous and next page when in the middle', () => {
    const data = manifest({
      guide: {
        pages: {
          hello: HELLO_PAGE,
          settings: SETTINGS_PAGE,
          world: WORLD_PAGE,
        },
        redirects: {},
        sidebarNodes: [
          link('/guide/hello', 'Hello'),
          link('/guide/world', 'World'),
          link('/guide/settings', 'Settings'),
        ],
      },
    });

    expect(getAdjacentPages(data, WORLD_PAGE)).toEqual({
      nextPage: SETTINGS_PAGE,
      previousPage: HELLO_PAGE,
    });
  });

  it('returns only the next page when at the start', () => {
    const data = manifest({
      guide: {
        pages: {
          hello: HELLO_PAGE,
          world: WORLD_PAGE,
        },
        redirects: {},
        sidebarNodes: [
          link('/guide/hello', 'Hello'),
          link('/guide/world', 'World'),
        ],
      },
    });

    expect(getAdjacentPages(data, HELLO_PAGE)).toEqual({
      nextPage: WORLD_PAGE,
    });
  });

  it('returns only the previous page when at the end', () => {
    const data = manifest({
      guide: {
        pages: {
          hello: HELLO_PAGE,
          world: WORLD_PAGE,
        },
        redirects: {},
        sidebarNodes: [
          link('/guide/hello', 'Hello'),
          link('/guide/world', 'World'),
        ],
      },
    });

    expect(getAdjacentPages(data, WORLD_PAGE)).toEqual({
      previousPage: HELLO_PAGE,
    });
  });

  it('returns an empty object when the page href is not in the sidebar', () => {
    const data = manifest({
      guide: {
        pages: {
          settings: SETTINGS_PAGE,
        },
        redirects: {},
        sidebarNodes: [
          link('/guide/hello', 'Hello'),
        ],
      },
    });

    expect(getAdjacentPages(data, SETTINGS_PAGE)).toEqual({});
  });
});

describe('getFirstPageMeta', () => {
  it('returns the page matching the first sidebar link', () => {
    expect(
      getFirstPageMeta(
        manifest({
          guide: {
            pages: {
              hello: HELLO_PAGE,
            },
            redirects: {},
            sidebarNodes: [
              link('/guide/hello', 'Hello'),
            ],
          },
        }),
        'guide',
      ),
    ).toBe(HELLO_PAGE);
  });

  it('returns the page matching the first link in a nested group', () => {
    expect(
      getFirstPageMeta(
        manifest({
          guide: {
            pages: {
              hello: HELLO_PAGE,
            },
            redirects: {},
            sidebarNodes: [
              {
                children: [
                  link('/guide/hello', 'Hello'),
                ],
                collapsible: false,
                kind: 'group',
                label: 'Getting started',
              },
            ],
          },
        }),
        'guide',
      ),
    ).toBe(HELLO_PAGE);
  });

  it('returns `undefined` when the collection is missing', () => {
    expect(getFirstPageMeta(manifest({}), 'missing')).toBeUndefined();
  });

  it('returns `undefined` when the sidebar is empty', () => {
    expect(
      getFirstPageMeta(
        manifest({
          guide: {
            pages: {},
            redirects: {},
            sidebarNodes: [],
          },
        }),
        'guide',
      ),
    ).toBeUndefined();
  });
});

describe('getPage', () => {
  it('returns the page when found', () => {
    expect(
      getPage(
        manifest({
          guide: {
            pages: {
              hello: HELLO_PAGE,
            },
            redirects: {},
            sidebarNodes: [],
          },
        }),
        'guide',
        'hello',
      ),
    ).toBe(HELLO_PAGE);
  });

  it('returns `undefined` when not found', () => {
    expect(getPage(manifest({}), 'missing', 'hello')).toBeUndefined();
  });
});
