import { runTrackers } from '../tracker';
import { resolveFormatter } from './formatter';

export function formatList(
  items: Iterable<string>,
  locale: string,
  options?: Intl.ListFormatOptions,
): string {
  runTrackers();
  return resolveFormatter(Intl.ListFormat, locale, options).format(items);
}
