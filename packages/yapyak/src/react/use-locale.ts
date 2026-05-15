import { useSyncExternalStore } from 'react';

import { getLocale, setLocale, subscribeLocale } from '../locale/index.ts';

/**
 * Returns the current locale and a setter, like `useState`.
 *
 * The component re-renders when the locale changes.
 *
 * @example
 * ```tsx
 * function LanguageSwitcher() {
 *   const [locale, setLocale] = useLocale();
 *   return (
 *     <select value={locale} onChange={(event) => setLocale(event.target.value)}>
 *       <option value="en">English</option>
 *       <option value="sv">Svenska</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useLocale(): readonly [string, (locale: string) => void] {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return [locale, setLocale];
}
