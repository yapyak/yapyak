import { resolveFormatter } from '../formatter';
import { runTrackers } from '../tracker';

export function formatPercent(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.NumberFormat, locale, {
    ...options,
    style: 'percent',
  }).format(value);
}
