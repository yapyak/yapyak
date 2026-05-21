import type { ReactElement, ReactNode } from 'react';

import { createContext, useSyncExternalStore } from 'react';

import { getLocale, subscribeLocale } from '../locale';

/** Props for {@link IntlProvider}. */
export interface IntlProviderProps {
  children: ReactNode;
}

const LocaleContext = createContext<string>('en');

/**
 * Provides locale context to the React tree. Wrap your app once at the root.
 *
 * @remarks
 * Re-renders descendants when {@link setLocale} is called, so {@link t} calls
 * inside the tree return the new locale's strings.
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

  const current = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return (
    <LocaleContext
      key={current}
      value={current}
    >
      {children}
    </LocaleContext>
  );
}
