import { getLocaleStore } from '../locale/store.js';

export interface ReactiveLocale {
  current: string;
}

export function useLocale(): ReactiveLocale {
  const store = getLocaleStore();
  let value = $state(store.get());
  $effect(() => {
    return store.subscribe(() => {
      value = store.get();
    });
  });
  return {
    get current(): string {
      return value;
    },
    set current(next: string) {
      store.set(next);
    },
  };
}
