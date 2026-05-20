import type { ReactElement, ReactNode } from 'react';

import { createContext, useSyncExternalStore } from 'react';

import { i18n } from '../i18n';

const subscribe = (notify: () => void): (() => void) =>
  i18n.subscribe(() => notify());

const snapshot = (): string => i18n.locale;

/** Props for `IntlProvider`. */
export interface IntlProviderProps {
  children: ReactNode;
}

const LocaleContext = createContext<string>('en');

/**
 * Subscribes the React tree to i18n changes.
 *
 * Wrap your app once at the root. Re-renders descendants when
 * `i18n.setLocale()` is called, so `t()` calls inside the tree return the new
 * locale's strings.
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

  const locale = useSyncExternalStore(subscribe, snapshot, snapshot);
  return (
    <LocaleContext
      key={locale}
      value={locale}
    >
      {children}
    </LocaleContext>
  );
}
