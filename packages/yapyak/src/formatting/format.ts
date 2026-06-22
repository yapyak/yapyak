import type { Locale } from '../locale';
import type { Currency } from './currency';

import { getLocale } from '../locale';
import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

/**
 * Options for {@link Format.number}.
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
 */
export type FormatDateTimeOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
>;

/**
 * Options for {@link Format.list}.
 */
export type FormatListOptions = Omit<Intl.ListFormatOptions, 'localeMatcher'>;

/**
 * Options for {@link Format.relativeTime}.
 */
export type FormatRelativeTimeOptions = Omit<
  Intl.RelativeTimeFormatOptions,
  'localeMatcher'
>;

/**
 * The format. Formats values for the active locale.
 */
export type Format = {
  /**
   * Formats a number for the active locale.
   *
   * @param value - The numeric value.
   * @param options - The options.
   *
   * @example
   * ```ts
   * format.number(1234.5);
   * ```
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
   * @param value - The date or timestamp.
   * @param options - The options.
   *
   * @example
   * ```ts
   * format.dateTime(new Date());
   * ```
   *
   * @example Date style
   * ```ts
   * format.dateTime(new Date(), { dateStyle: 'long' });
   * ```
   *
   * @example Date and time combined
   * ```ts
   * format.dateTime(new Date(), { dateStyle: 'medium', timeStyle: 'short' });
   * ```
   */
  dateTime(value: Date | number, options?: FormatDateTimeOptions): string;

  /**
   * Scopes formatting to a fixed locale.
   *
   * @param locale - The locale code.
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
   * @param items - The items to join.
   * @param options - The options.
   *
   * @example
   * ```ts
   * format.list(['apple', 'pear', 'orange']);
   * ```
   *
   * @example Disjunction
   * ```ts
   * format.list(['apple', 'pear'], { type: 'disjunction' });
   * ```
   */
  list(items: Iterable<string>, options?: FormatListOptions): string;

  /**
   * Formats a relative time offset for the active locale.
   *
   * @param value - The signed integer offset.
   * @param unit - The time unit.
   * @param options - The options.
   *
   * @example
   * ```ts
   * format.relativeTime(-1, 'day');
   * ```
   */
  relativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: FormatRelativeTimeOptions,
  ): string;
};

/**
 * The default formatter.
 *
 * @example
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
