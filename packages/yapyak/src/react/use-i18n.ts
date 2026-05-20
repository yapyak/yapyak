import type { I18n } from '../i18n';

import { useSyncExternalStore } from 'react';

import { i18n } from '../i18n';

const subscribe = (notify: () => void): (() => void) =>
  i18n.subscribe(() => notify());

const snapshot = (): string => i18n.locale;

/**
 * Subscribes the component to i18n state changes and returns the i18n namespace.
 *
 * The component re-renders whenever the i18n state changes. The returned object
 * has the same shape as the core `i18n` — destructure `locale` and `setLocale`
 * for React-idiomatic patterns.
 *
 * @returns The i18n namespace (re-renders the calling component on change).
 *
 * @example
 * ```tsx
 * import { t } from 'yapyak';
 * import { useI18n } from 'yapyak/react';
 *
 * function LanguageSwitcher() {
 *   const { locale, setLocale, locales } = useI18n();
 *   return (
 *     <select value={locale} onChange={(e) => setLocale(e.target.value)}>
 *       {locales.map((code) => <option key={code} value={code}>{code}</option>)}
 *     </select>
 *   );
 * }
 * ```
 */
export function useI18n(): I18n {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return i18n;
}
