import { resolveFormatter } from '../formatter';
import { runTrackers } from '../tracker';

export function formatList(
  items: Iterable<string>,
  locale: string,
  options?: Intl.ListFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.ListFormat, locale, options).format(items);
}
