import type { Locale } from 'yapyak';

import { getLocale, setLocale } from 'yapyak';
import { autoRegisterTracker, autoSubscribeLocale } from 'yapyak/internal';

let active = $state(getLocale());

if (typeof window !== 'undefined') {
  autoSubscribeLocale(import.meta, (next) => {
    active = next;
  });
  autoRegisterTracker(import.meta, () => {
    void active;
  });
}

/**
 * Reactive locale store.
 *
 * @example
 * ```svelte
 * <script>
 *   import { locales, t } from 'yapyak';
 *   import { locale } from '@yapyak/svelte';
 * </script>
 *
 * <p>{t('Hello')}</p>
 * {#each locales as value (value)}
 *   <button
 *     disabled={value === locale.current}
 *     onclick={() => (locale.current = value)}
 *     type="button"
 *   >
 *     {value}
 *   </button>
 * {/each}
 * ```
 */
export const locale: {
  current: Locale;
} = {
  get current(): Locale {
    return typeof window === 'undefined' ? getLocale() : active;
  },
  set current(value: Locale) {
    setLocale(value);
  },
};
