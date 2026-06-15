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

  describe('unit safety net', () => {
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

    it('returns a `<value> <unit>` fallback formatter when Intl rejects the unit', () => {
      const formatter = resolveFormatter(Intl.NumberFormat, 'en', {
        style: 'unit',
        unit: 'bogus',
      });
      expect(formatter.format(5)).toBe('5 bogus');
    });

    it('warns once per locale-and-unit pair when the unit is rejected', () => {
      resolveFormatter(Intl.NumberFormat, 'en', {
        style: 'unit',
        unit: 'bogus-once',
      });
      resolveFormatter(Intl.NumberFormat, 'en', {
        style: 'unit',
        unit: 'bogus-once',
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warns again when the same unit is used in a different locale', () => {
      resolveFormatter(Intl.NumberFormat, 'en', {
        style: 'unit',
        unit: 'bogus-cross-locale',
      });
      resolveFormatter(Intl.NumberFormat, 'sv', {
        style: 'unit',
        unit: 'bogus-cross-locale',
      });
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('preserves the active-locale grouping in the fallback rendering', () => {
      const formatter = resolveFormatter(Intl.NumberFormat, 'sv', {
        style: 'unit',
        unit: 'bogus-grouped',
      });
      expect(formatter.format(1234.5)).toMatch(/^1\D234,5 bogus-grouped$/);
    });
  });

  describe('time-zone safety net', () => {
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

    it('returns a system-time-zone fallback when Intl rejects the time zone', () => {
      const formatter = resolveFormatter(Intl.DateTimeFormat, 'en', {
        dateStyle: 'medium',
        timeZone: 'Not/AZone',
      });
      expect(formatter.format(new Date('2026-01-15T00:00:00Z'))).toContain(
        '2026',
      );
    });

    it('warns once per locale-and-zone pair when the zone is rejected', () => {
      resolveFormatter(Intl.DateTimeFormat, 'en', {
        timeZone: 'Not/Once',
      });
      resolveFormatter(Intl.DateTimeFormat, 'en', {
        timeZone: 'Not/Once',
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warns again when the same zone is used in a different locale', () => {
      resolveFormatter(Intl.DateTimeFormat, 'en', {
        timeZone: 'Not/CrossLocale',
      });
      resolveFormatter(Intl.DateTimeFormat, 'sv', {
        timeZone: 'Not/CrossLocale',
      });
      expect(warnSpy).toHaveBeenCalledTimes(2);
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
