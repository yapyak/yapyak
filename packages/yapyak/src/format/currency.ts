import type { FormatNumberOptions } from './number';

import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

/**
 * Formats a currency amount for the current locale.
 *
 * @param value - The numeric amount to format.
 * @param currency - The ISO 4217 currency code (e.g. `'SEK'`, `'EUR'`, `'USD'`).
 * @param options - Optional native `Intl.NumberFormatOptions` plus an optional `locale` override. The `style` and `currency` fields are set automatically and override anything provided here.
 *
 * @example Format an amount in Swedish kronor
 * ```ts
 * import { formatCurrency } from 'yapyak';
 *
 * formatCurrency(499, 'SEK');
 * formatCurrency(499, 'EUR', { currencyDisplay: 'narrowSymbol' });
 * ```
 */
export function formatCurrency(
  value: number,
  currency: string,
  options?: FormatNumberOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  return getFormatter(Intl.NumberFormat, locale, {
    ...rest,
    currency,
    style: 'currency',
  }).format(value);
}
