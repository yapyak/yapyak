/**
 * Builds the BCP 47 fallback chain for a locale tag.
 *
 * @param locale - The locale tag to walk down from.
 * @returns The chain from most-specific to least-specific tag, starting with
 *   the input and ending with the bare language subtag.
 *
 * @remarks
 * Repeatedly drops the trailing subtag delimited by `-`. Does not normalize
 * casing — pass a canonical tag (e.g. from {@link parseLocale}) if you need
 * normalization. Does not include the default locale; callers append it as a
 * final fallback.
 *
 * @example Walk regional and script variants down to the bare language
 * ```ts
 * import { getLocaleFallbackChain } from 'yapyak';
 *
 * getLocaleFallbackChain('zh-Hant-TW'); // => ['zh-Hant-TW', 'zh-Hant', 'zh']
 * getLocaleFallbackChain('sv-FI');      // => ['sv-FI', 'sv']
 * getLocaleFallbackChain('en');         // => ['en']
 * ```
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
