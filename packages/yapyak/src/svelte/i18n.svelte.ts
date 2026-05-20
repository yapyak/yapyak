import { i18n as core } from '../i18n';
import { registerTracker } from '../runtime';

let activeLocale = $state(core.locale);

if (typeof window !== 'undefined') {
  core.subscribe((state) => {
    activeLocale = state.locale;
  });
  registerTracker(() => {
    void activeLocale;
  });
}

/** The reactive i18n namespace for Svelte 5. */
export interface I18n {
  /** The default locale (build-time constant). */
  readonly defaultLocale: string;
  /** The currently-active locale. Reactive — assign to switch. */
  locale: string;
  /** All configured locales (build-time constant). */
  readonly locales: readonly string[];
}

/**
 * The reactive i18n namespace for Svelte 5.
 *
 * Read `i18n.locale` inside a component to subscribe; assign to switch.
 *
 * @example
 * ```svelte
 * <script>
 *   import { t } from 'yapyak';
 *   import { i18n } from 'yapyak/svelte';
 * </script>
 *
 * <p>{t('Hello')}</p>
 * <select bind:value={i18n.locale}>
 *   {#each i18n.locales as code}
 *     <option value={code}>{code}</option>
 *   {/each}
 * </select>
 * ```
 */
export const i18n: I18n = {
  defaultLocale: core.defaultLocale,
  get locale(): string {
    return typeof window === 'undefined' ? core.locale : activeLocale;
  },
  set locale(value: string) {
    core.setLocale(value);
  },
  locales: core.locales,
};
