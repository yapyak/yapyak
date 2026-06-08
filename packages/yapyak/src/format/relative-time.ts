import { resolveFormatter } from '../formatter';
import { runTrackers } from '../tracker';

export function formatRelativeTime(
  value: number,
  locale: string,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.RelativeTimeFormat, locale, options).format(
    value,
    unit,
  );
}
