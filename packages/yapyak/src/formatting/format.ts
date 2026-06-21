import type { Locale } from '../locale';
import type { Currency } from './currency';

import { getLocale } from '../locale';
import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

/**
 * Options for {@link Format.number}.
 *
 * @remarks
 * Discriminated union over `Intl.NumberFormatOptions`'s `style`. The `currency` branch types the `currency` field as {@link Currency}.
 *
 * @shape Omit<Intl.NumberFormatOptions, 'localeMatcher'> & \{ style: 'decimal' | 'currency' | 'percent' | 'unit' \}
 *
 * @example
 * ```ts
 * format.number(1234.5, { maximumFractionDigits: 1 });
 * format.number(199, { style: 'currency', currency: 'EUR' });
 * format.number(199, { style: 'currency' }); // ✗ currency missing
 * format.number(0.42, { style: 'percent' });
 * format.number(45, { style: 'unit', unit: 'kilometer' });
 * format.number(45, { style: 'unit' }); // ✗ unit missing
 * ```
 */
export type FormatNumberOptions = Omit<
  Intl.NumberFormatOptions,
  | 'currency'
  | 'currencyDisplay'
  | 'currencySign'
  | 'localeMatcher'
  | 'style'
  | 'unit'
  | 'unitDisplay'
> &
  (
    | {
        style?: 'decimal';
      }
    | {
        style: 'currency';
        currency: Currency | (string & {});
        currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
        currencySign?: 'standard' | 'accounting';
      }
    | {
        style: 'percent';
      }
    | {
        style: 'unit';
        unit: string;
        unitDisplay?: 'short' | 'narrow' | 'long';
      }
  );

/**
 * Options for {@link Format.dateTime}.
 *
 * @remarks
 * `Intl.DateTimeFormatOptions` minus `localeMatcher`.
 *
 * @example
 * ```ts
 * format.dateTime(new Date(), { dateStyle: 'long' });
 * format.dateTime(new Date(), { timeStyle: 'short' });
 * format.dateTime(new Date(), { dateStyle: 'medium', timeStyle: 'short' });
 * ```
 */
export type FormatDateTimeOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
>;

/**
 * Options for {@link Format.list}.
 *
 * @remarks
 * `Intl.ListFormatOptions` minus `localeMatcher`.
 *
 * @example
 * ```ts
 * format.list(['apple', 'pear', 'orange']);
 * format.list(['apple', 'pear'], { type: 'disjunction' });
 * format.list(['a', 'b', 'c'], { style: 'narrow' });
 * ```
 */
export type FormatListOptions = Omit<Intl.ListFormatOptions, 'localeMatcher'>;

/**
 * Options for {@link Format.relativeTime}.
 *
 * @remarks
 * `Intl.RelativeTimeFormatOptions` minus `localeMatcher`.
 *
 * @example
 * ```ts
 * format.relativeTime(-1, 'day');
 * format.relativeTime(-1, 'day', { numeric: 'auto' });
 * ```
 */
export type FormatRelativeTimeOptions = Omit<
  Intl.RelativeTimeFormatOptions,
  'localeMatcher'
>;

/**
 * The format. Formats values for the active locale via `Intl`.
 *
 * @remarks
 * One method per underlying `Intl.*Format` class. Scope a fixed locale with {@link Format.in}.
 */
export type Format = {
  /**
   * Formats a number for the active locale.
   *
   * @remarks
   * Handles decimal, currency, percent, and unit styles via the `style` option. When `style` is `'currency'`, the `currency` field is required and typed against ISO 4217. When `style` is `'unit'`, the `unit` field is required. A currency code unsupported by the host `Intl` does not throw — yapyak falls back to a `<value> <code>` rendering.
   *
   * @param value - The numeric value.
   * @param options - Number-format options. See {@link FormatNumberOptions}.
   *
   * @example Currency
   * ```ts
   * format.number(199, { style: 'currency', currency: 'EUR' });
   * ```
   *
   * @example Percent
   * ```ts
   * format.number(0.42, { style: 'percent' });
   * ```
   */
  number(value: number, options?: FormatNumberOptions): string;

  /**
   * Formats a date or time for the active locale.
   *
   * @remarks
   * Supply `dateStyle` alone, `timeStyle` alone, both for the combined form, or individual field options for finer control.
   *
   * @param value - The date or timestamp.
   * @param options - Date-time-format options. See {@link FormatDateTimeOptions}.
   *
   * @example Date only
   * ```ts
   * format.dateTime(new Date(), { dateStyle: 'long' });
   * ```
   *
   * @example Time only
   * ```ts
   * format.dateTime(new Date(), { timeStyle: 'short' });
   * ```
   */
  dateTime(value: Date | number, options?: FormatDateTimeOptions): string;

  /**
   * Scopes formatting to a fixed locale.
   *
   * @param locale - The locale code, e.g. `'sv'`.
   *
   * @example
   * ```ts
   * format.in('sv').number(199, { style: 'currency', currency: 'SEK' });
   * ```
   */
  in(locale: Locale): Format;

  /**
   * Formats a list of strings as an enumeration for the active locale.
   *
   * @remarks
   * Joins with the active locale's conventions. Use `type: 'disjunction'` for `'or'`-style joins and `type: 'unit'` for unit lists.
   *
   * @param items - The items to join.
   * @param options - List-format options. See {@link FormatListOptions}.
   */
  list(items: Iterable<string>, options?: FormatListOptions): string;

  /**
   * Formats a relative time offset for the active locale.
   *
   * @remarks
   * Negative values render in the past, positive in the future, per the locale's rules.
   *
   * @param value - The signed integer offset.
   * @param unit - The time unit, e.g. `'day'`.
   * @param options - Relative-time-format options. See {@link FormatRelativeTimeOptions}.
   */
  relativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: FormatRelativeTimeOptions,
  ): string;
};

/**
 * Locale-aware formatting backed by `Intl`.
 *
 * @example Active locale and a scoped locale
 * ```ts
 * import { format } from 'yapyak';
 *
 * format.number(1000);
 * format.in('sv').number(200, { style: 'currency', currency: 'SEK' });
 * ```
 */
export const format: Format = createFormat();

function createFormat(boundLocale?: string): Format {
  return {
    dateTime: (value, options) => {
      runTrackers();
      const locale = boundLocale ?? getLocale();
      return resolveFormatter(Intl.DateTimeFormat, locale, options).format(
        value,
      );
    },
    in: (locale) => createFormat(locale),
    list: (items, options) => {
      runTrackers();
      const locale = boundLocale ?? getLocale();
      return resolveFormatter(Intl.ListFormat, locale, options).format(items);
    },
    number: (value, options) => {
      runTrackers();
      const locale = boundLocale ?? getLocale();
      return resolveFormatter(Intl.NumberFormat, locale, options).format(value);
    },
    relativeTime: (value, unit, options) => {
      runTrackers();
      const locale = boundLocale ?? getLocale();
      return resolveFormatter(Intl.RelativeTimeFormat, locale, options).format(
        value,
        unit,
      );
    },
  };
}
