import { useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { getDevVersion, subscribeDev, subscribeLocale } from 'yapyak/internal';

const noopSubscribe = (): (() => void) => () => undefined;
const devSubscribe = import.meta.env?.DEV ? subscribeDev : noopSubscribe;

export function useYapyak(): void {
  useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  useSyncExternalStore(devSubscribe, getDevVersion, getDevVersion);
}
