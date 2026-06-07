import { getFormatter } from '../intl-cache';
import { runTrackers } from '../tracker';

export function formatList(
  items: Iterable<string>,
  locale: string,
  options?: Intl.ListFormatOptions,
): string {
  runTrackers();
  return getFormatter(Intl.ListFormat, locale, options).format(items);
}
