import { resolveFormatter } from '../formatter';
import { runTrackers } from '../tracker';

const DEFAULT: Intl.DateTimeFormatOptions = { timeStyle: 'short' };

export function formatTime(
  value: Date | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  runTrackers();
  const resolved = options ?? DEFAULT;
  return resolveFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
