import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
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

  describe('currency safety net', () => {
    let warnSpy: ReturnType<
      typeof vi.fn<(message: string, meta?: Record<string, unknown>) => void>
    >;

    beforeEach(() => {
      warnSpy =
        vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
      setWarn(warnSpy);
    });

    afterEach(() => {
      resetWarn();
    });

    it('returns a `<value> <code>` fallback formatter when Intl rejects the currency code', () => {
      const formatter = resolveFormatter(Intl.NumberFormat, 'en', {
        currency: 'XYZ',
        style: 'currency',
      });
      expect(formatter.format(499)).toBe('499 XYZ');
    });

    it('warns once per locale-and-code pair when the code is rejected', () => {
      resolveFormatter(Intl.NumberFormat, 'en', {
        currency: 'AAA',
        style: 'currency',
      });
      resolveFormatter(Intl.NumberFormat, 'en', {
        currency: 'AAA',
        style: 'currency',
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warns again when the same code is used in a different locale', () => {
      resolveFormatter(Intl.NumberFormat, 'en', {
        currency: 'BBB',
        style: 'currency',
      });
      resolveFormatter(Intl.NumberFormat, 'sv', {
        currency: 'BBB',
        style: 'currency',
      });
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('preserves the active-locale grouping in the fallback rendering', () => {
      const formatter = resolveFormatter(Intl.NumberFormat, 'sv', {
        currency: 'XYZ',
        style: 'currency',
      });
      expect(formatter.format(1234.5)).toMatch(/^1\D234,5 XYZ$/);
    });
  });

  it('clears the oldest formatter from the cache when capacity is reached', () => {
    class FakeFormatter {
      locale: string;
      options?: object;
      constructor(locale: string, options?: object) {
        this.locale = locale;
        this.options = options;
      }
    }
    const ctor = FakeFormatter as unknown as new (
      locale: string,
      options?: object,
    ) => FakeFormatter;
    const oldest = resolveFormatter(ctor, 'en', {
      tag: 1,
    });
    for (let tag = 2; tag <= 65; tag++) {
      resolveFormatter(ctor, 'en', {
        tag,
      });
    }
    const evictedReplacement = resolveFormatter(ctor, 'en', {
      tag: 1,
    });
    expect(evictedReplacement).not.toBe(oldest);
  });
});
