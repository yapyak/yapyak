import type { Ref } from 'vue';

import { customRef } from 'vue';

import {
  getLocale as coreLocale,
  setLocale,
  subscribeLocale,
} from '../locale';
import { registerTracker } from '../runtime';

/**
 * The reactive locale ref for Vue.
 *
 * `locale` is a `Ref<string>`. Read `locale.value` in `<script setup>`; it
 * auto-unwraps in templates. Assignable via `locale.value = ...` or `v-model`.
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
    subscribeLocale(() => {
      trigger();
    });
    registerTracker(() => {
      void locale.value;
    });
  }
  return {
    get(): string {
      track();
      return coreLocale();
    },
    set(value: string): void {
      setLocale(value);
    },
  };
});
