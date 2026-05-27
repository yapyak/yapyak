import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

/**
 * Options for {@link formatDate}, {@link formatTime}, and {@link formatDateTime}.
 *
 * @remarks
 * Native `Intl.DateTimeFormatOptions` extended with an optional `locale` override.
 */
export type FormatDateOptions = Intl.DateTimeFormatOptions & {
  /** The locale to use for this single call. Overrides {@link getLocale}. */
  locale?: string;
};

const DEFAULT: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

/**
 * Formats a date value for the current locale.
 *
 * @param value - The date to format.
 * @param options - Optional native `Intl.DateTimeFormatOptions` plus an optional `locale` override. Defaults to `{ dateStyle: 'medium' }` when no options are provided.
 * @returns The locale-formatted date.
 *
 * @example Format a date with the medium preset
 * ```ts
 * import { formatDate } from 'yapyak';
 *
 * formatDate(new Date(), { dateStyle: 'medium' });
 * ```
 */
export function formatDate(
  value: Date | number,
  options?: FormatDateOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  const resolved = Object.keys(rest).length === 0 ? DEFAULT : rest;
  return getFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
