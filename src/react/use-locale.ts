import { useSyncExternalStore } from 'react';
import { getLocaleStore } from '../locale/store.js';

export function useLocale(): readonly [string, (locale: string) => void] {
  const store = getLocaleStore();
  const locale = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => store.get(),
  );
  return [locale, store.set];
}
