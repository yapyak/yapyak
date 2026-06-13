import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

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
