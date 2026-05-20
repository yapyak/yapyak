import type { Ref } from 'vue';

import { customRef } from 'vue';

import { i18n as core } from '../i18n';
import { registerTracker } from '../runtime';

const localeRef = customRef<string>((track, trigger) => {
  if (typeof window !== 'undefined') {
    core.subscribe(() => {
      trigger();
    });
    registerTracker(() => {
      void localeRef.value;
    });
  }
  return {
    get(): string {
      track();
      return core.locale;
    },
    set(value: string): void {
      core.setLocale(value);
    },
  };
});

/** The reactive i18n namespace for Vue. */
export interface I18n {
  /** The currently-active locale as a writable Vue ref. */
  locale: Ref<string>;
  /** All configured locales (build-time constant). */
  readonly locales: readonly string[];
  /** The default locale (build-time constant). */
  readonly defaultLocale: string;
}

/**
 * The reactive i18n namespace for Vue 3.
 *
 * `i18n.locale` is a Vue ref — destructure to use idiomatically in
 * `<script setup>`. Top-level refs auto-unwrap in templates.
 *
 * @example
 * ```vue
 * <script setup>
 * import { t } from 'yapyak';
 * import { i18n } from 'yapyak/vue';
 *
 * const { locale, locales } = i18n;
 * </script>
 *
 * <template>
 *   <p>{{ t('Hello') }}</p>
 *   <select v-model="locale">
 *     <option v-for="code in locales" :key="code" :value="code">{{ code }}</option>
 *   </select>
 * </template>
 * ```
 */
export const i18n: I18n = {
  locale: localeRef,
  get locales(): readonly string[] {
    return core.locales;
  },
  get defaultLocale(): string {
    return core.defaultLocale;
  },
};
