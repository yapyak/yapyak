import type { FormatDateOptions } from './date';

import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

const DEFAULT: Intl.DateTimeFormatOptions = { timeStyle: 'short' };

/**
 * Formats a time-of-day value for the current locale.
 *
 * @param value - The date whose time portion is formatted.
 * @param options - Optional native `Intl.DateTimeFormatOptions` plus an optional `locale` override. Defaults to `{ timeStyle: 'short' }` when no options are provided.
 *
 * @example Format a time with the short preset
 * ```ts
 * import { formatTime } from 'yapyak';
 *
 * formatTime(new Date(), { timeStyle: 'short' });
 * ```
 */
export function formatTime(
  value: Date | number,
  options?: FormatDateOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  const resolved = Object.keys(rest).length === 0 ? DEFAULT : rest;
  return getFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
