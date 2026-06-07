import { runTrackers } from '../tracker';
import { getFormatter } from './cache';

const DEFAULT: Intl.DateTimeFormatOptions = { timeStyle: 'short' };

export function formatTime(
  value: Date | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  runTrackers();
  const resolved = options ?? DEFAULT;
  return getFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
