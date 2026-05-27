import { runTrackers } from '../translation';
import { getFormatter } from './cache';
import { resolveLocale } from './resolve';

/**
 * Options for {@link formatList}.
 *
 * @remarks
 * Native `Intl.ListFormatOptions` extended with an optional `locale` override.
 */
export type FormatListOptions = Intl.ListFormatOptions & {
  /** The locale to use for this single call. Overrides {@link getLocale}. */
  locale?: string;
};

/**
 * Formats a list of strings as a locale-aware enumeration.
 *
 * @remarks
 * Joins items using the active locale's conventions (e.g. `'a, b, and c'` in English, `'a, b och c'` in Swedish). Use `type: 'disjunction'` for `'or'`-style joins and `type: 'unit'` for unit lists.
 *
 * @param items - The items to join.
 * @param options - Optional native `Intl.ListFormatOptions` plus an optional `locale` override.
 *
 * @example Join items with a locale-aware conjunction
 * ```ts
 * import { formatList } from 'yapyak';
 *
 * formatList(['apples', 'pears', 'plums']);
 * ```
 */
export function formatList(
  items: Iterable<string>,
  options?: FormatListOptions,
): string {
  runTrackers();
  const { locale, rest } = resolveLocale(options);
  return getFormatter(Intl.ListFormat, locale, rest).format(items);
}
