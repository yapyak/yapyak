import { getLocaleStore } from '../locale/store.js';

export interface ReactiveLocale {
  current: string;
}

const store = getLocaleStore();
let value = $state(store.get());

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    value = store.get();
  });
}

export const locale: ReactiveLocale = {
  get current(): string {
    return typeof window === 'undefined' ? store.get() : value;
  },
  set current(next: string) {
    store.set(next);
  },
};
