import { runTrackers } from '../tracker';
import { getFormatter } from './cache';

export function formatCurrency(
  value: number,
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.NumberFormat, locale, {
    ...options,
    currency,
    style: 'currency',
  }).format(value);
}
