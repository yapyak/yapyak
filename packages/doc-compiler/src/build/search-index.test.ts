import type { Block, HeadingBlock } from '../access';
import type { Manifest, Page, SidebarNode } from './manifest';

import { describe, expect, it } from 'vitest';

import { buildSearchIndex } from './search-index';

function paragraph(text: string): Block {
  return {
    children: [
      {
        kind: 'text',
        value: text,
      },
    ],
    kind: 'paragraph',
  };
}

function heading(level: HeadingBlock['level'], text: string): HeadingBlock {
  return {
    children: [
      {
        kind: 'text',
        value: text,
      },
    ],
    id: text.toLowerCase(),
    kind: 'heading',
    level,
  };
}

function page(blocks: Block[]): Page {
  return {
    blocks,
    description: '',
    href: '/guide/save',
    meta: {},
    title: 'Save',
  };
}

function manifest(pageValue: Page, sidebar: SidebarNode[]): Manifest {
  return {
    collections: {
      guide: {
        pages: {
          save: pageValue,
        },
        redirects: {},
        sidebar,
      },
    },
    options: {},
    symbols: {},
    version: 1,
  };
}

const sidebar: SidebarNode[] = [
  {
    children: [
      {
        href: '/guide/save',
        kind: 'link',
        label: 'Save changes',
      },
    ],
    collapsible: false,
    kind: 'group',
    label: 'Settings',
  },
];

describe('buildSearchIndex', () => {
  it('builds a page entry from a page', () => {
    const index = buildSearchIndex(
      manifest(
        page([
          paragraph('Hello'),
        ]),
        sidebar,
      ),
    );

    expect(index.entries).toContainEqual({
      body: 'Hello',
      breadcrumb: [
        'Settings',
      ],
      collection: 'guide',
      href: '/guide/save',
      kind: 'page',
      title: 'Save',
    });
  });

  it('builds a heading entry for each section', () => {
    const index = buildSearchIndex(
      manifest(
        page([
          heading(2, 'World'),
          heading(2, 'Cancel'),
        ]),
        sidebar,
      ),
    );

    const headings = index.entries.filter((entry) => entry.kind === 'heading');
    expect(headings.map((entry) => entry.href)).toEqual([
      '/guide/save#world',
      '/guide/save#cancel',
    ]);
  });

  it('holds the page title in the heading breadcrumb', () => {
    const index = buildSearchIndex(
      manifest(
        page([
          heading(2, 'World'),
        ]),
        sidebar,
      ),
    );

    const [headingEntry] = index.entries.filter(
      (entry) => entry.kind === 'heading',
    );
    expect(headingEntry?.breadcrumb).toEqual([
      'Settings',
      'Save',
    ]);
  });

  it('splits the section body at headings', () => {
    const index = buildSearchIndex(
      manifest(
        page([
          paragraph('Hello'),
          heading(2, 'World'),
          paragraph('Cancel'),
        ]),
        sidebar,
      ),
    );

    const pageEntry = index.entries.find((entry) => entry.kind === 'page');
    const headingEntry = index.entries.find(
      (entry) => entry.kind === 'heading',
    );
    expect(pageEntry?.body).toBe('Hello');
    expect(headingEntry?.body).toBe('Cancel');
  });

  it('builds no heading entry when the page has no heading', () => {
    const index = buildSearchIndex(
      manifest(
        page([
          paragraph('Hello'),
        ]),
        sidebar,
      ),
    );

    expect(index.entries.filter((entry) => entry.kind === 'heading')).toEqual(
      [],
    );
  });
});
