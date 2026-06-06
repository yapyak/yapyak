import { runTrackers } from '../tracker';
import { getFormatter } from './cache';

const DEFAULT: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

export function formatDate(
  value: Date | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  runTrackers();
  const resolved =
    options === undefined || Object.keys(options).length === 0
      ? DEFAULT
      : options;
  return getFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
