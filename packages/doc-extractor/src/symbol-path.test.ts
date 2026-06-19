import { describe, expect, it } from 'vitest';

import { buildSymbolHref, encodeSymbolSegment } from './symbol-path';

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

describe('encodeSymbolSegment', () => {
  it('returns the segment unchanged when no leading `$`', () => {
    expect(encodeSymbolSegment('Greeter')).toBe('Greeter');
  });

  it('strips a leading `$` from the segment', () => {
    expect(encodeSymbolSegment('$Greeter')).toBe('Greeter');
  });
});
