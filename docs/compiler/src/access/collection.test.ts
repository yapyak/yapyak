import type { Manifest } from '../build';

import { describe, expect, it } from 'vitest';

import { getCollection } from './collection';

function manifest(collections: Manifest['collections']): Manifest {
  return {
    collections,
    options: {},
    symbols: {},
    version: 1,
  };
}

describe('getCollection', () => {
  it('returns the collection when found', () => {
    const guide = {
      content: {},
      pages: {},
      redirects: {},
      sidebarNodes: [],
    };
    expect(
      getCollection(
        manifest({
          guide,
        }),
        'guide',
      ),
    ).toBe(guide);
  });

  it('returns `undefined` when not found', () => {
    expect(getCollection(manifest({}), 'missing')).toBeUndefined();
  });
});
