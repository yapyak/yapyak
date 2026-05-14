import { useSyncExternalStore } from 'react';
import { getLocaleStore } from '../locale/store.js';

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
  const store = getLocaleStore();
  const locale = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => store.get(),
  );
  return [locale, store.set];
}
