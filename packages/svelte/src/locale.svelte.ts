import { getLocale, setLocale } from '@yapyak/core';
import { registerTracker, subscribeLocale } from '@yapyak/core/internal';

let active = $state(getLocale());

if (typeof window !== 'undefined') {
  subscribeLocale((next) => {
    active = next;
  });
  registerTracker(() => {
    void active;
  });
}

/** The locale. Holds the current locale string with reactive read and write. */
export interface Locale {
  /** The current locale. Reads track reactivity; writes call {@link setLocale}. */
  current: string;
}

/**
 * Reactive locale store.
 *
 * @example Read and write the locale in a Svelte component
 * ```svelte
 * <script>
 *   // Svelte reserves `$`-prefixed identifiers for store auto-subscriptions,
 *   // so alias the macro to a local name.
 *   import { $t as t } from '@yapyak/core';
 *   import { locale } from '@yapyak/svelte';
 * </script>
 *
 * <p>{t('Hello')}</p>
 * <select bind:value={locale.current}>
 *   <option value="en">English</option>
 *   <option value="sv">Svenska</option>
 * </select>
 * ```
 */
export const locale: Locale = {
  get current(): string {
    return typeof window === 'undefined' ? getLocale() : active;
  },
  set current(value: string) {
    setLocale(value);
  },
};
