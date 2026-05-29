import { runTrackers } from '../translation';
import { getFormatter } from './cache';

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
