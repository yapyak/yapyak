import type { CurrencyCode } from './known';

import { runTrackers } from '../../tracker';
import { resolveFormatter } from '../formatter';

export function formatCurrency(
  value: number,
  locale: string,
  currency: CurrencyCode | (string & {}),
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.NumberFormat, locale, {
    ...options,
    currency,
    style: 'currency',
  }).format(value);
}
