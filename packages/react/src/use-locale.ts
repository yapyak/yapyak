import { useSyncExternalStore } from 'react';
import { getLocale, setLocale } from 'yapyak';
import { subscribeLocale } from 'yapyak/internal';

/**
 * Subscribes the component to locale changes.
 *
 * @example Switch locale with a select
 * ```tsx
 * import { $t } from 'yapyak';
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
