import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

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
