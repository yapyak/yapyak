import type { Locale } from '../locale';
import type { Currency } from './currency';

import { getLocale } from '../locale';
import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

/**
 * Options for {@link format.number}.
 *
 * @see [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
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
 * Options for {@link format.dateTime}.
 *
 * @see [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
 */
export type FormatDateTimeOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
>;

/**
 * Options for {@link format.list}.
 *
 * @see [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat)
 */
export type FormatListOptions = Omit<Intl.ListFormatOptions, 'localeMatcher'>;

/**
 * Options for {@link format.relativeTime}.
 *
 * @see [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat)
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
   * // output:
   * // en-US: '1,234.5'
   * // sv-SE: '1 234,5'
   * // de-DE: '1.234,5'
   * ```
   *
   * @example Currency
   * ```ts
   * format.number(199, { style: 'currency', currency: 'EUR' });
   * // output:
   * // en-US: '€199.00'
   * // sv-SE: '199,00 €'
   * // pt-BR: '€ 199,00'
   * ```
   *
   * @example Percent
   * ```ts
   * format.number(0.42, { style: 'percent' });
   * // output:
   * // en-US: '42%'
   * // sv-SE: '42 %'
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
   * // output:
   * // en-US: '6/17/2026'
   * // sv-SE: '2026-06-17'
   * ```
   *
   * @example Date style
   * ```ts
   * format.dateTime(new Date(), { dateStyle: 'long' });
   * // output:
   * // en-US: 'June 17, 2026'
   * // sv-SE: '17 juni 2026'
   * // ja-JP: '2026年6月17日'
   * ```
   *
   * @example Date and time combined
   * ```ts
   * format.dateTime(new Date(), { dateStyle: 'medium', timeStyle: 'short' });
   * // output: en-US: 'Jun 17, 2026, 4:30 PM'
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
   * // output: '199,00 kr'
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
   * // output:
   * // en-US: 'apple, pear, and orange'
   * // sv-SE: 'apple, pear och orange'
   * ```
   *
   * @example Disjunction
   * ```ts
   * format.list(['apple', 'pear'], { type: 'disjunction' });
   * // output: en-US: 'apple or pear'
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
   * // output:
   * // en-US: '1 day ago'
   * // sv-SE: 'för 1 dag sedan'
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
 * // output:
 * // en-US: '1,000'
 * // sv-SE: '1 000'
 *
 * format.in('sv').number(200, { style: 'currency', currency: 'SEK' });
 * // output: '200,00 kr'
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
