const RTL_SCRIPTS = new Set([
  'Adlm',
  'Arab',
  'Aran',
  'Hebr',
  'Mand',
  'Mend',
  'Nkoo',
  'Rohg',
  'Samr',
  'Syrc',
  'Thaa',
  'Yezi',
]);

/**
 * The text direction of a locale.
 *
 * @param locale - The locale tag.
 *
 * @throws {RangeError} when `locale` is not a well-formed BCP 47 tag.
 *
 * @see [BCP 47](https://datatracker.ietf.org/doc/html/bcp47)
 *
 * @example
 * ```ts
 * import { getTextDirection } from 'yapyak';
 *
 * getTextDirection('ar'); // output: 'rtl'
 * getTextDirection('sv'); // output: 'ltr'
 * ```
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const script = new Intl.Locale(locale).maximize().script;
  if (script === undefined) {
    return 'ltr';
  }
  return RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr';
}
