import type { Ref } from 'vue';

import { customRef } from 'vue';

import { getLocale, setLocale, subscribeLocale } from '../locale';
import { registerTracker } from '../runtime';

/**
 * The reactive locale ref for Vue.
 *
 * @remarks
 * Typed as `Ref<string>`. Auto-unwraps in templates. Reads track reactivity, writes call {@link setLocale}.
 *
 * @example
 * ```vue
 * <script setup>
 * import { t } from 'yapyak';
 * import { locale } from 'yapyak/vue';
 * </script>
 *
 * <template>
 *   <p>{{ t('Hello') }}: {{ locale }}</p>
 *   <select v-model="locale">
 *     <option value="en">English</option>
 *     <option value="sv">Svenska</option>
 *   </select>
 * </template>
 * ```
 */
export const locale: Ref<string> = customRef<string>((track, trigger) => {
  if (typeof window !== 'undefined') {
    subscribeLocale(trigger);
    registerTracker(() => {
      void locale.value;
    });
  }
  return {
    get(): string {
      track();
      return getLocale();
    },
    set(value: string): void {
      setLocale(value);
    },
  };
});
