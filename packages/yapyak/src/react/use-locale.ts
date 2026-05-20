import { useSyncExternalStore } from 'react';

import { getLocale, setLocale, subscribeLocale } from '../locale';

/**
 * Returns the current locale and a setter, in tuple form.
 *
 * The component re-renders whenever the locale changes.
 *
 * @returns A tuple `[locale, setLocale]`.
 *
 * @example
 * ```tsx
 * import { t } from 'yapyak';
 * import { useLocale } from 'yapyak/react';
 *
 * function LocaleToggle() {
 *   const [locale, setLocale] = useLocale();
 *   return (
 *     <select value={locale} onChange={(e) => setLocale(e.target.value)}>
 *       <option value="en">English</option>
 *       <option value="sv">Svenska</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useLocale(): [string, (value: string) => void] {
  const current = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return [current, setLocale];
}
