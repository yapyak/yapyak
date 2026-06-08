import { resolveFormatter } from '../formatter';
import { runTrackers } from '../tracker';

const CURRENCY_CODE_RX = /^[A-Za-z]{3}$/;

export function formatCurrency(
  value: number,
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (!CURRENCY_CODE_RX.test(currency)) {
    throw new Error(
      `Invalid currency code "${currency}": expected 3 ASCII letters (ISO 4217).`,
    );
  }
  runTrackers();
  return resolveFormatter(Intl.NumberFormat, locale, {
    ...options,
    currency,
    style: 'currency',
  }).format(value);
}
