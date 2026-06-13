import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.NumberFormat, locale, options).format(value);
}
