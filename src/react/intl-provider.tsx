import type { ReactElement, ReactNode } from 'react';

import { createContext, useSyncExternalStore } from 'react';

import { getLocale, subscribeLocale } from '../locale/store.js';

/** Props for `IntlProvider`. */
export interface IntlProviderProps {
  children: ReactNode;
}

const LocaleContext = createContext<string>('en');

/**
 * Subscribes the React tree to locale changes.
 *
 * Wrap your app once at the root. Re-renders descendants when `setLocale` is
 * called, so `t()` calls inside the tree return the new locale's strings.
 *
 * @example
 * ```tsx
 * <IntlProvider>
 *   <App />
 * </IntlProvider>
 * ```
 */
export function IntlProvider(props: IntlProviderProps): ReactElement {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return (
    <LocaleContext
      key={locale}
      value={locale}
    >
      {props.children}
    </LocaleContext>
  );
}
