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
 * @remarks
 * On the client, reads track reactivity and writes call {@link setLocale}. On the server, reads return {@link getLocale} directly with no reactivity hook-up — Svelte's `$state` and yapyak's subscriber are wired only when `typeof window !== 'undefined'`.
 *
 * @example Read and write the locale in a Svelte component
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
