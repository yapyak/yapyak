import { computed, ref, type WritableComputedRef } from 'vue';
import { getLocaleStore } from '../locale/store.js';

const store = getLocaleStore();
const valueRef = ref(store.get());

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    valueRef.value = store.get();
  });
}

export const locale: WritableComputedRef<string> = computed<string>({
  get: () =>
    typeof window === 'undefined' ? store.get() : valueRef.value,
  set: (next: string) => {
    store.set(next);
  },
});
