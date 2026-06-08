import { describe, expect, it } from 'vitest';

import { resolveFormatter } from './formatter';

describe('resolveFormatter', () => {
  it('returns the same formatter for an identical locale and options', () => {
    const a = resolveFormatter(Intl.NumberFormat, 'en', { useGrouping: true });
    const b = resolveFormatter(Intl.NumberFormat, 'en', { useGrouping: true });
    expect(a).toBe(b);
  });

  it('returns a fresh formatter for a different locale', () => {
    const a = resolveFormatter(Intl.NumberFormat, 'en', undefined);
    const b = resolveFormatter(Intl.NumberFormat, 'sv', undefined);
    expect(a).not.toBe(b);
  });

  it('returns a fresh formatter for a different option shape', () => {
    const a = resolveFormatter(Intl.NumberFormat, 'en', { useGrouping: true });
    const b = resolveFormatter(Intl.NumberFormat, 'en', { useGrouping: false });
    expect(a).not.toBe(b);
  });

  it('returns a fresh formatter for a different `ctor`', () => {
    const a = resolveFormatter(Intl.NumberFormat, 'en', undefined);
    const b = resolveFormatter(Intl.DateTimeFormat, 'en', undefined);
    expect(a).not.toBe(b);
  });

  it('clears the oldest formatter from the cache when capacity is reached', () => {
    class FakeFormatter {
      constructor(public locale: string, public options?: object) {}
    }
    const ctor = FakeFormatter as unknown as new (
      locale: string,
      options?: object,
    ) => FakeFormatter;
    const oldest = resolveFormatter(ctor, 'en', { tag: 1 });
    for (let tag = 2; tag <= 65; tag++) {
      resolveFormatter(ctor, 'en', { tag });
    }
    const evictedReplacement = resolveFormatter(ctor, 'en', { tag: 1 });
    expect(evictedReplacement).not.toBe(oldest);
  });
});
