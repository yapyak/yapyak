import type { CurrencyCodeInput } from './code';

import { runTrackers } from '../../tracker';
import { resolveFormatter } from '../formatter';

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
