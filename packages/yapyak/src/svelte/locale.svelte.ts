import { getLocale, setLocale, subscribeLocale } from '../locale';
import { registerTracker } from '../runtime';

let active = $state(getLocale());

if (typeof window !== 'undefined') {
  subscribeLocale((next) => {
    active = next;
  });
  registerTracker(() => {
    void active;
  });
}

/** A reactive locale handle for Svelte 5. */
export interface Locale {
  /** The current locale. Reads track reactivity, writes call {@link setLocale}. */
  current: string;
}

/**
 * The reactive locale store for Svelte 5.
 *
 * Read `locale.current` inside a component to subscribe; assign to switch.
 *
 * @example
 * ```svelte
 * <script>
 *   import { t } from 'yapyak';
 *   import { locale } from 'yapyak/svelte';
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
