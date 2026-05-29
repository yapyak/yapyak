import { runTrackers } from '../translation';
import { getFormatter } from './cache';

export function formatRelativeTime(
  value: number,
  locale: string,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.RelativeTimeFormat, locale, options).format(
    value,
    unit,
  );
}
