import type { ReactElement, ReactNode } from 'react';

import { getLocale, subscribeLocale } from '@yapyak/core';
import { createContext, useSyncExternalStore } from 'react';

/** Props for {@link LocaleProvider}. */
export interface LocaleProviderProps {
  children: ReactNode;
}

const LocaleContext = createContext<string>('en');

/**
 * Provides locale context to the React tree.
 *
 * @remarks
 * Mounts once at the React tree's root. Re-renders descendants when {@link setLocale} is called, so {@link $t} calls inside the tree return the new locale's strings.
 *
 * @example
 * ```tsx
 * import { LocaleProvider } from '@yapyak/react';
 *
 * function App() {
 *   return (
 *     <LocaleProvider>
 *       <App />
 *     </LocaleProvider>
 *   );
 * }
 * ```
 */
export function LocaleProvider(props: LocaleProviderProps): ReactElement {
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
