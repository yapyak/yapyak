import { runTrackers } from '../translation';
import { getFormatter } from './cache';

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.NumberFormat, locale, options).format(value);
}
