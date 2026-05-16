import type { WritableComputedRef } from 'vue';

import { computed, ref } from 'vue';

import { getLocale, setLocale, subscribeLocale } from '../locale/index.ts';
import { registerTracker } from '../runtime/index.ts';

const valueRef = ref(getLocale());

if (typeof window !== 'undefined') {
  subscribeLocale(() => {
    valueRef.value = getLocale();
  });
  registerTracker(() => {
    void valueRef.value;
  });
}

/**
 * The reactive locale ref for Vue.
 *
 * Read `locale.value` inside a setup function or template to subscribe;
 * assign to switch.
 *
 * @example
 * ```vue
 * <script setup>
 * import { locale } from 'yapyak/vue'
 * import { t } from 'yapyak'
 * </script>
 *
 * <template>
 *   <p>{{ t('Hello') }}</p>
 *   <select v-model="locale">
 *     <option value="en">English</option>
 *     <option value="sv">Svenska</option>
 *   </select>
 * </template>
 * ```
 */
export const locale: WritableComputedRef<string> = computed<string>({
  get() {
    return typeof window === 'undefined' ? getLocale() : valueRef.value;
  },
  set(next: string) {
    setLocale(next);
  },
});
