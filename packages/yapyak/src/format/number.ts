import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

/**
 * Options for {@link formatNumber}, {@link formatCurrency}, and {@link formatPercent}.
 *
 * @remarks
 * Native `Intl.NumberFormatOptions` extended with an optional `locale` override.
 */
export type FormatNumberOptions = Intl.NumberFormatOptions & {
  /** The locale to use for this single call. Overrides {@link getLocale}. */
  locale?: string;
};

/**
 * Formats a number for the current locale.
 *
 * @param value - The numeric value to format.
 * @param options - Optional native `Intl.NumberFormatOptions` plus an optional `locale` override.
 *
 * @example Format an integer with thousands separators
 * ```ts
 * import { formatNumber } from 'yapyak';
 *
 * formatNumber(123456.78);
 * formatNumber(123456.78, { maximumFractionDigits: 1 });
 * ```
 */
export function formatNumber(
  value: number,
  options?: FormatNumberOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  return getFormatter(Intl.NumberFormat, locale, rest).format(value);
}
