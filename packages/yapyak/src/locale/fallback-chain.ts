/**
 * Builds the BCP 47 fallback chain for a locale tag.
 *
 * @remarks
 * Does not normalize casing or include the default locale.
 *
 * @param locale - The locale tag.
 *
 * @example
 * ```ts
 * import { getLocaleFallbackChain } from 'yapyak';
 *
 * getLocaleFallbackChain('zh-Hant-TW'); // output: ['zh-Hant-TW', 'zh-Hant', 'zh']
 * getLocaleFallbackChain('sv-FI'); // output: ['sv-FI', 'sv']
 * getLocaleFallbackChain('en'); // output: ['en']
 * ```
 *
 * @see [BCP 47](https://datatracker.ietf.org/doc/html/bcp47)
 */
export function getLocaleFallbackChain(locale: string): string[] {
  const chain: string[] = [
    locale,
  ];
  let current = locale;
  while (current.includes('-')) {
    current = current.slice(0, current.lastIndexOf('-'));
    chain.push(current);
  }
  return chain;
}
