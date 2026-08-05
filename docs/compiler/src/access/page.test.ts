import type { NavigationManifest, Page, SidebarNode } from '../build';

import { describe, expect, it } from 'vitest';

import { getFirstPage, getPage } from './page';

const HELLO_PAGE: Page = {
  breadcrumbs: [],
  description: '',
  href: '/guide/hello',
  meta: {},
  title: 'Hello',
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

describe('getFirstPage', () => {
  it('returns the page matching the first sidebar link', () => {
    expect(
      getFirstPage(
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
      getFirstPage(
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
    expect(getFirstPage(manifest({}), 'missing')).toBeUndefined();
  });

  it('returns `undefined` when the sidebar is empty', () => {
    expect(
      getFirstPage(
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
