import { describe, expect, it } from 'vitest';

import { encodeSymbolSegment } from './symbol-segment';

describe('encodeSymbolSegment', () => {
  it('returns the segment unchanged when no leading `$`', () => {
    expect(encodeSymbolSegment('Greeter')).toBe('Greeter');
  });

  it('strips a leading `$` from the segment', () => {
    expect(encodeSymbolSegment('$Greeter')).toBe('Greeter');
  });
});
