import type { FormatDateOptions } from './date';

import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

const DEFAULT: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

/**
 * Formats a combined date and time value for the current locale.
 *
 * @param value - The date to format.
 * @param options - Optional native `Intl.DateTimeFormatOptions` plus an optional `locale` override. Defaults to `{ dateStyle: 'medium', timeStyle: 'short' }` when no options are provided.
 * @returns The locale-formatted date-time.
 *
 * @example Format a date and time together
 * ```ts
 * import { formatDateTime } from 'yapyak';
 *
 * formatDateTime(new Date(), { dateStyle: 'medium', timeStyle: 'short' });
 * ```
 */
export function formatDateTime(
  value: Date | number,
  options?: FormatDateOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  const resolved = Object.keys(rest).length === 0 ? DEFAULT : rest;
  return getFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
