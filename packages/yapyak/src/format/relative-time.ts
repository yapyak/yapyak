import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

/**
 * Options for {@link formatRelativeTime}.
 *
 * @remarks
 * Native `Intl.RelativeTimeFormatOptions` extended with an optional `locale` override.
 */
export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions & {
  /** The locale to use for this single call. Overrides {@link getLocale}. */
  locale?: string;
};

/**
 * Formats a relative time offset for the current locale.
 *
 * @remarks
 * Negative values render in the past (`-2, 'day'` becomes `'2 days ago'`); positive values render in the future (`3, 'hour'` becomes `'in 3 hours'`). The exact wording follows the active locale's `Intl.RelativeTimeFormat` rules.
 *
 * @param value - The signed integer offset (negative for past, positive for future).
 * @param unit - The time unit (`'day'`, `'hour'`, `'minute'`, etc.).
 * @param options - Optional native `Intl.RelativeTimeFormatOptions` plus an optional `locale` override.
 * @returns The locale-formatted relative time.
 *
 * @example Render past and future offsets
 * ```ts
 * import { formatRelativeTime } from 'yapyak';
 *
 * formatRelativeTime(-2, 'day');
 * formatRelativeTime(3, 'hour');
 * ```
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: FormatRelativeTimeOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  return getFormatter(Intl.RelativeTimeFormat, locale, rest).format(
    value,
    unit,
  );
}
