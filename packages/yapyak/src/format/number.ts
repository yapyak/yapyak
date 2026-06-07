import { getFormatter } from '../intl-cache';
import { runTrackers } from '../tracker';

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.NumberFormat, locale, options).format(value);
}
