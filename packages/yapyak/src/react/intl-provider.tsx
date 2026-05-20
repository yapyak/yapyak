import type { ReactElement, ReactNode } from 'react';

import { createContext, useSyncExternalStore } from 'react';

import { getLocale, subscribeLocale } from '../locale';

const subscribe = (notify: () => void): (() => void) =>
  subscribeLocale(() => notify());

/** Props for `IntlProvider`. */
export interface IntlProviderProps {
  children: ReactNode;
}

const LocaleContext = createContext<string>('en');

/**
 * Subscribes the React tree to locale changes.
 *
 * Wrap your app once at the root. Re-renders descendants when `setLocale()` is
 * called, so `t()` calls inside the tree return the new locale's strings.
 *
 * @example
 * ```tsx
 * import { IntlProvider } from 'yapyak/react';
 *
 * function App() {
 *   return (
 *     <IntlProvider>
 *       <YourApp />
 *     </IntlProvider>
 *   );
 * }
 * ```
 */
export function IntlProvider(props: IntlProviderProps): ReactElement {
  const { children } = props;

  const current = useSyncExternalStore(subscribe, getLocale, getLocale);
  return (
    <LocaleContext
      key={current}
      value={current}
    >
      {children}
    </LocaleContext>
  );
}
