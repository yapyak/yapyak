import type { NavigationManifest, Page, SidebarNode } from '../build';

import { describe, expect, it } from 'vitest';

import { getPagination } from './pagination';

const HELLO_PAGE: Page = {
  breadcrumbs: [],
  description: '',
  href: '/guide/hello',
  meta: {},
  title: 'Hello',
};

const WORLD_PAGE: Page = {
  breadcrumbs: [],
  description: '',
  href: '/guide/world',
  meta: {},
  title: 'World',
};

const SETTINGS_PAGE: Page = {
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

describe('getPagination', () => {
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

    expect(getPagination(data, WORLD_PAGE)).toEqual({
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

    expect(getPagination(data, HELLO_PAGE)).toEqual({
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

    expect(getPagination(data, WORLD_PAGE)).toEqual({
      previousPage: HELLO_PAGE,
    });
  });

  it('returns an empty pagination when the page href is not in the sidebar', () => {
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

    expect(getPagination(data, SETTINGS_PAGE)).toEqual({});
  });
});
