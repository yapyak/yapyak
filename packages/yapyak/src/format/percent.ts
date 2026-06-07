import { getFormatter } from '../intl-cache';
import { runTrackers } from '../tracker';

export function formatPercent(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.NumberFormat, locale, {
    ...options,
    style: 'percent',
  }).format(value);
}
