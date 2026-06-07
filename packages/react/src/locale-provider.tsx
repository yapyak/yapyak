import type { ReactElement, ReactNode } from 'react';

import { useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { subscribeLocale } from 'yapyak/internal';

/** Props for {@link LocaleProvider}. */
export interface LocaleProviderProps {
  /** The children. */
  children: ReactNode;
}

/**
 * Triggers descendant re-renders whenever the active locale changes.
 *
 * @remarks
 * Wraps the React tree's root and subscribes to {@link setLocale}. On every locale switch, this component re-renders, cascading a render through its subtree so {@link t} calls inside descendants return the new locale's strings.
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
  useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return <>{children}</>;
}
