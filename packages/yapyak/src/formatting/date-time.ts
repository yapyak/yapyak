import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

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
  const resolved = options ?? DEFAULT;
  return resolveFormatter(Intl.DateTimeFormat, locale, resolved).format(value);
}
