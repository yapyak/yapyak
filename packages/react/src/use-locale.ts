import { getLocale, setLocale } from '@yapyak/core';
import { subscribeLocale } from '@yapyak/core/internal';
import { useSyncExternalStore } from 'react';

/**
 * Subscribes to locale changes and returns the current locale and a setter.
 *
 * @remarks
 * The component re-renders whenever the locale changes.
 *
 * @example
 * ```tsx
 * import { $t } from '@yapyak/core';
 * import { useLocale } from '@yapyak/react';
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
