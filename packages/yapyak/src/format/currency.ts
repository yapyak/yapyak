import type { CurrencyCodeInput } from '../currency';

import { resolveFormatter } from '../formatter';
import { runTrackers } from '../tracker';

export function formatCurrency(
  value: number,
  locale: string,
  currency: CurrencyCodeInput,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.NumberFormat, locale, {
    ...options,
    currency,
    style: 'currency',
  }).format(value);
}
