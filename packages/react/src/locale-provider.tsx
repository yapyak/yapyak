import type { ReactElement, ReactNode } from 'react';
import type { Locale } from 'yapyak';

import { createContext, useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { subscribeLocale } from 'yapyak/internal';

/** Props for {@link LocaleProvider}. */
export interface LocaleProviderProps {
  /** The children. */
  children: ReactNode;
}

const LocaleContext = createContext<Locale | null>(null);

/**
 * Renders children within a locale context.
 *
 * @remarks
 * Mounts once at the React tree's root. Re-renders descendants when {@link setLocale} is called, so {@link t} calls inside the tree return the new locale's strings.
 *
 * @param props - Props bundle. See {@link LocaleProviderProps}.
 *
 * @example Wrap the React tree
 * ```tsx
 * import { LocaleProvider } from '@yapyak/react';
 *
 * function App() {
 *   return (
 *     <LocaleProvider>
 *       <Routes />
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
