import { computed, ref, type WritableComputedRef } from 'vue';
import { getLocaleStore } from '../locale/store.js';
import { registerTracker } from '../runtime/tracker.js';

const store = getLocaleStore();
const valueRef = ref(store.get());

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    valueRef.value = store.get();
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
 * import { locale } from 'yapyak/vue';
 * import { t } from 'yapyak';
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
    return typeof window === 'undefined' ? store.get() : valueRef.value;
  },
  set(next: string) {
    store.set(next);
  },
});
