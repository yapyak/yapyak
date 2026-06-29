import type { Manifest, SidebarNode } from '../build';

import { describe, expect, it } from 'vitest';

import { getSidebar } from './sidebar';

function manifest(collections: Manifest['collections']): Manifest {
  return {
    collections,
    options: {},
    symbols: {},
    version: 1,
  };
}

describe('getSidebar', () => {
  it('returns the sidebar of the collection', () => {
    const sidebar: SidebarNode[] = [
      {
        href: '/guide/settings',
        kind: 'link',
        label: 'Settings',
      },
    ];
    expect(
      getSidebar(
        manifest({
          guide: {
            pages: {},
            redirects: {},
            sidebar,
          },
        }),
        'guide',
      ),
    ).toBe(sidebar);
  });

  it('returns an empty array when the collection is missing', () => {
    expect(getSidebar(manifest({}), 'missing')).toEqual([]);
  });
});
