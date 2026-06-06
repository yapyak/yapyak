import type { Locale } from 'yapyak';

import { useSyncExternalStore } from 'react';
import { getLocale, setLocale } from 'yapyak';
import { subscribeLocale } from 'yapyak/internal';

/**
 * Subscribes the component to locale changes.
 *
 * @example Switch locale by mapping over `locales`
 * ```tsx
 * import { locales, t } from 'yapyak';
 * import { useLocale } from '@yapyak/react';
 *
 * function LocaleToggle() {
 *   const [locale, setLocale] = useLocale();
 *   return (
 *     <>
 *       {locales.map((value) => (
 *         <button
 *           disabled={value === locale}
 *           key={value}
 *           onClick={() => setLocale(value)}
 *           type="button"
 *         >
 *           {value}
 *         </button>
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export function useLocale(): [Locale, (value: Locale) => void] {
  const current = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return [current, setLocale];
}
