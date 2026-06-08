import { describe, expect, it } from 'vitest';

import { resolveFormatter } from './formatter';

describe('resolveFormatter', () => {
  it('returns the same formatter for an identical locale and options', () => {
    const first = resolveFormatter(Intl.NumberFormat, 'en', {
      useGrouping: true,
    });
    const second = resolveFormatter(Intl.NumberFormat, 'en', {
      useGrouping: true,
    });
    expect(first).toBe(second);
  });

  it('returns a fresh formatter for a different locale', () => {
    const english = resolveFormatter(Intl.NumberFormat, 'en', undefined);
    const swedish = resolveFormatter(Intl.NumberFormat, 'sv', undefined);
    expect(english).not.toBe(swedish);
  });

  it('returns a fresh formatter for a different option shape', () => {
    const grouped = resolveFormatter(Intl.NumberFormat, 'en', {
      useGrouping: true,
    });
    const ungrouped = resolveFormatter(Intl.NumberFormat, 'en', {
      useGrouping: false,
    });
    expect(grouped).not.toBe(ungrouped);
  });

  it('returns a fresh formatter for a different `ctor`', () => {
    const numberFormatter = resolveFormatter(
      Intl.NumberFormat,
      'en',
      undefined,
    );
    const dateFormatter = resolveFormatter(
      Intl.DateTimeFormat,
      'en',
      undefined,
    );
    expect(numberFormatter).not.toBe(dateFormatter);
  });

  it('clears the oldest formatter from the cache when capacity is reached', () => {
    class FakeFormatter {
      constructor(
        public locale: string,
        public options?: object,
      ) {}
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
