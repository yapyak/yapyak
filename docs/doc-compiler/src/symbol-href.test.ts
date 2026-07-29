import { describe, expect, it } from 'vitest';

import { buildSymbolHref } from './symbol-href';

describe('buildSymbolHref', () => {
  it('builds an href for a root-module export', () => {
    expect(
      buildSymbolHref('yapyak', 'createTranslator', {
        collectionName: 'reference',
        packageName: 'yapyak',
        packageSlug: 'yapyak',
      }),
    ).toBe('/reference/yapyak/createTranslator');
  });

  it('builds an href for a sub-module export', () => {
    expect(
      buildSymbolHref('yapyak/processor', 'createProcessor', {
        collectionName: 'reference',
        packageName: 'yapyak',
        packageSlug: 'yapyak',
      }),
    ).toBe('/reference/yapyak/processor/createProcessor');
  });
});
