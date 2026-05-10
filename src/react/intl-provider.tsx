import {
  createContext,
  type ReactElement,
  type ReactNode,
  useSyncExternalStore,
} from 'react';
import { getLocaleStore } from '../locale/store.js';

export interface IntlProviderProps {
  children: ReactNode;
}

const LocaleContext = createContext<string>('en');

export function IntlProvider(props: IntlProviderProps): ReactElement {
  const store = getLocaleStore();
  const locale = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => store.get(),
  );
  return (
    <LocaleContext value={locale} key={locale}>
      {props.children}
    </LocaleContext>
  );
}
