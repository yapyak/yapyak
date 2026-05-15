import { getLocale, setLocale, subscribeLocale } from '../locale/index.ts';
import { registerTracker } from '../runtime/index.ts';

/** A reactive locale handle for Svelte 5. */
export interface ReactiveLocale {
  /** The current locale. Reads track reactivity, writes call `setLocale`. */
  current: string;
}

let value = $state(getLocale());

if (typeof window !== 'undefined') {
  subscribeLocale(() => {
    value = getLocale();
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
    return typeof window === 'undefined' ? getLocale() : value;
  },
  set current(next: string) {
    setLocale(next);
  },
};
