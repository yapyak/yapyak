import type { Locale } from 'yapyak';

import { getLocale, setLocale } from 'yapyak';
import { registerTracker, subscribeLocale } from 'yapyak/internal';

declare global {
  interface ImportMeta {
    hot?: {
      dispose(callback: () => void): void;
    };
  }
}

let active = $state(getLocale());

if (typeof window !== 'undefined') {
  const unsubscribe = subscribeLocale((next) => {
    active = next;
  });
  const untrack = registerTracker(() => {
    void active;
  });
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      unsubscribe();
      untrack();
    });
  }
}

/**
 * Reactive locale store.
 *
 * @remarks
 * Reads track reactivity; writes call {@link setLocale}.
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
export const locale: { current: Locale } = {
  get current(): Locale {
    return typeof window === 'undefined' ? getLocale() : active;
  },
  set current(value: Locale) {
    setLocale(value);
  },
};
