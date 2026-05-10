import {
  computed,
  onScopeDispose,
  ref,
  type WritableComputedRef,
} from 'vue';
import { getLocaleStore } from '../locale/store.js';

export function useLocale(): WritableComputedRef<string> {
  const store = getLocaleStore();
  const localeRef = ref(store.get());
  const unsubscribe = store.subscribe(() => {
    localeRef.value = store.get();
  });
  onScopeDispose(unsubscribe);
  return computed({
    get: () => localeRef.value,
    set: (next: string) => {
      store.set(next);
    },
  });
}
