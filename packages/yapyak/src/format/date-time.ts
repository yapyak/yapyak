import { runTrackers } from '../translation';
import { getFormatter } from './cache';

const DEFAULT: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

export function formatDateTime(
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
