import type { ReactElement, ReactNode } from 'react';

import { Fragment, useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { subscribeLocale } from 'yapyak/internal';

/** Props for {@link LocaleProvider}. */
export type LocaleProviderProps = {
  /** The children. */
  children: ReactNode;
};

/**
 * Re-renders descendants on every locale change.
 *
 * @remarks
 * Wraps the React tree so every `t()` call inside descendants returns the active locale's strings.
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
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return <Fragment key={locale}>{children}</Fragment>;
}
