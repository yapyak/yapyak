import type { FormatNumberOptions } from './number';

import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

/**
 * Formats a fraction as a locale-aware percentage.
 *
 * @remarks
 * The input is treated as a fraction — `0.42` renders as `'42%'` (or the locale equivalent).
 *
 * @param value - The fractional value (e.g. `0.42` for 42%).
 * @param options - Optional native `Intl.NumberFormatOptions` plus an optional `locale` override. The `style` field is set automatically and overrides anything provided here.
 * @returns The locale-formatted percentage.
 *
 * @example Render a fraction as percent
 * ```ts
 * import { formatPercent } from 'yapyak';
 *
 * formatPercent(0.42);
 * ```
 */
export function formatPercent(
  value: number,
  options?: FormatNumberOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  return getFormatter(Intl.NumberFormat, locale, {
    ...rest,
    style: 'percent',
  }).format(value);
}
