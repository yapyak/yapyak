import { runTrackers } from '../tracker';
import { getFormatter } from './cache';

export function formatList(
  items: Iterable<string>,
  locale: string,
  options?: Intl.ListFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.ListFormat, locale, options).format(items);
}
