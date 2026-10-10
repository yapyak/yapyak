import { use, useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { getDevVersion, subscribeDev, subscribeLocale } from 'yapyak/internal';

import { DevVersionContext, LocaleContext } from './context';

const noopSubscribe = (): (() => void) => () => undefined;
const devSubscribe = import.meta.env?.DEV ? subscribeDev : noopSubscribe;

export function useYapyak(): void {
  const locale = use(LocaleContext);
  use(DevVersionContext);
  if (locale !== undefined) {
    return;
  }
  useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  useSyncExternalStore(devSubscribe, getDevVersion, getDevVersion);
}
