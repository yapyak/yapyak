import { type ReactNode, useSyncExternalStore } from 'react';
import { getLocaleStore } from '../locale/store.js';

export interface IntlProviderProps {
  children: ReactNode;
}

export function IntlProvider(props: IntlProviderProps): ReactNode {
  const store = getLocaleStore();
  useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return props.children;
}
