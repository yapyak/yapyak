'use client';

import type { ReactNode } from 'react';

import { useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { getDevVersion, subscribeDev, subscribeLocale } from 'yapyak/internal';

import { DevVersionContext, LocaleContext } from './context';

const noopSubscribe = (): (() => void) => () => undefined;
const devSubscribe = import.meta.env?.DEV ? subscribeDev : noopSubscribe;

/** Props for {@link YapyakProvider}. */
export type YapyakProviderProps = {
  /** The tree that reads the locale from the provider. */
  children: ReactNode;
};

/**
 * Renders its children with the active locale in React context.
 *
 * @remarks
 * Components below the provider read the locale from context instead of subscribing to the locale store through a hook of their own. A context read takes no slot in React's hook list, so a component that is called as a plain function no longer changes the hook count of its caller.
 *
 * @example
 * ```tsx
 * import { YapyakProvider } from '@yapyak/react/provider';
 * import { createRoot } from 'react-dom/client';
 *
 * import { App } from './app';
 *
 * createRoot(document.body).render(
 *   <YapyakProvider>
 *     <App />
 *   </YapyakProvider>,
 * );
 * ```
 */
export function YapyakProvider(props: YapyakProviderProps): ReactNode {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  const devVersion = useSyncExternalStore(
    devSubscribe,
    getDevVersion,
    getDevVersion,
  );
  return (
    <LocaleContext value={locale}>
      <DevVersionContext value={devVersion}>{props.children}</DevVersionContext>
    </LocaleContext>
  );
}
