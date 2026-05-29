import { getLocale } from '../locale';
import { formatCurrency } from './currency';
import { formatDate } from './date';
import { formatDateTime } from './date-time';
import { formatList } from './list';
import { formatNumber } from './number';
import { formatPercent } from './percent';
import { formatRelativeTime } from './relative-time';
import { formatTime } from './time';

/**
 * Locale-aware formatting backed by `Intl`.
 *
 * @remarks
 * Methods format for the active locale from {@link getLocale}. Scope a fixed locale with {@link Format.in} — option types stay pure `Intl.*Options`, with no `locale` field.
 */
export interface Format {
  /**
   * Formats a currency amount for the active locale.
   *
   * @remarks
   * The `style` and `currency` fields are set from the `currency` argument and override any provided in `options`.
   *
   * @param value - The numeric amount.
   * @param currency - The ISO 4217 currency code, e.g. `'SEK'`.
   * @param options - Native `Intl.NumberFormatOptions`.
   */
  currency(
    value: number,
    currency: string,
    options?: Intl.NumberFormatOptions,
  ): string;

  /**
   * Formats a date value for the active locale.
   *
   * @param value - The date or timestamp.
   * @param options - Native `Intl.DateTimeFormatOptions`.
   *
   * @defaultValue `{ dateStyle: 'medium' }`
   */
  date(value: Date | number, options?: Intl.DateTimeFormatOptions): string;

  /**
   * Formats a combined date and time value for the active locale.
   *
   * @param value - The date or timestamp.
   * @param options - Native `Intl.DateTimeFormatOptions`.
   *
   * @defaultValue `{ dateStyle: 'medium', timeStyle: 'short' }`
   */
  dateTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string;

  /**
   * Scopes formatting to a fixed locale.
   *
   * @param locale - The locale code, e.g. `'sv'`.
   */
  in(locale: string): Format;

  /**
   * Formats a list of strings as a locale-aware enumeration.
   *
   * @remarks
   * Joins with the active locale's conventions. Use `type: 'disjunction'` for `'or'`-style joins and `type: 'unit'` for unit lists.
   *
   * @param items - The items to join.
   * @param options - Native `Intl.ListFormatOptions`.
   */
  list(items: Iterable<string>, options?: Intl.ListFormatOptions): string;

  /**
   * Formats a number for the active locale.
   *
   * @param value - The numeric value.
   * @param options - Native `Intl.NumberFormatOptions`.
   */
  number(value: number, options?: Intl.NumberFormatOptions): string;

  /**
   * Formats a fraction as a locale-aware percentage.
   *
   * @remarks
   * The input is a fraction — `0.42` renders as `'42%'` (or the locale equivalent). The `style` field is set to `'percent'` and overrides any provided in `options`.
   *
   * @param value - The fractional value, e.g. `0.42`.
   * @param options - Native `Intl.NumberFormatOptions`.
   */
  percent(value: number, options?: Intl.NumberFormatOptions): string;

  /**
   * Formats a relative time offset for the active locale.
   *
   * @remarks
   * Negative values render in the past, positive in the future, per the locale's rules.
   *
   * @param value - The signed integer offset.
   * @param unit - The time unit, e.g. `'day'`.
   * @param options - Native `Intl.RelativeTimeFormatOptions`.
   */
  relativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
  ): string;

  /**
   * Formats a time-of-day value for the active locale.
   *
   * @param value - The date or timestamp whose time portion is formatted.
   * @param options - Native `Intl.DateTimeFormatOptions`.
   *
   * @defaultValue `{ timeStyle: 'short' }`
   */
  time(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
}

/**
 * Locale-aware formatting backed by `Intl`.
 *
 * @example Active locale and a scoped locale
 * ```ts
 * import { format } from 'yapyak';
 *
 * format.number(1000);
 * format.in('sv').currency(200, 'SEK');
 * ```
 */
export const format: Format = makeFormat();

function makeFormat(boundLocale?: string): Format {
  return {
    currency: (value, currency, options) =>
      formatCurrency(value, boundLocale ?? getLocale(), currency, options),
    date: (value, options) =>
      formatDate(value, boundLocale ?? getLocale(), options),
    dateTime: (value, options) =>
      formatDateTime(value, boundLocale ?? getLocale(), options),
    in: (locale) => makeFormat(locale),
    list: (items, options) =>
      formatList(items, boundLocale ?? getLocale(), options),
    number: (value, options) =>
      formatNumber(value, boundLocale ?? getLocale(), options),
    percent: (value, options) =>
      formatPercent(value, boundLocale ?? getLocale(), options),
    relativeTime: (value, unit, options) =>
      formatRelativeTime(value, boundLocale ?? getLocale(), unit, options),
    time: (value, options) =>
      formatTime(value, boundLocale ?? getLocale(), options),
  };
}
