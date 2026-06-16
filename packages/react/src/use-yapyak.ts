import { useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import { getDevVersion, subscribeDev, subscribeLocale } from 'yapyak/internal';

export function useYapyak(): void {
  useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  if (import.meta.env?.DEV) {
    useSyncExternalStore(subscribeDev, getDevVersion, getDevVersion);
  }
}
