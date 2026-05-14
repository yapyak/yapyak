import { getLocaleStore } from '../locale/store.js';
import { registerTracker } from '../runtime/tracker.js';

/** A reactive locale handle for Svelte 5. */
export interface ReactiveLocale {
  /** The current locale. Reads track reactivity, writes call `setLocale`. */
  current: string;
}

const store = getLocaleStore();
let value = $state(store.get());

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    value = store.get();
  });
  registerTracker(() => {
    void value;
  });
}

/**
 * The reactive locale store for Svelte 5.
 *
 * Read `locale.current` inside a component to subscribe; assign to switch.
 *
 * @example
 * ```svelte
 * <script>
 *   import { locale } from 'yapyak/svelte';
 *   import { t } from 'yapyak';
 * </script>
 *
 * <p>{t('Hello')}</p>
 * <select bind:value={locale.current}>
 *   <option value="en">English</option>
 *   <option value="sv">Svenska</option>
 * </select>
 * ```
 */
export const locale: ReactiveLocale = {
  get current(): string {
    return typeof window === 'undefined' ? store.get() : value;
  },
  set current(next: string) {
    store.set(next);
  },
};
