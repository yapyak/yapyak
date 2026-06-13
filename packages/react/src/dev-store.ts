import { useSyncExternalStore } from 'react';
import { getLocale } from 'yapyak';
import {
  getDevVersion,
  patch,
  purgeFile,
  subscribeDev,
  subscribeLocale,
} from 'yapyak/internal';

type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | unknown[];
};

if (typeof window !== 'undefined' && import.meta.hot?.on) {
  import.meta.hot.on('yapyak:patch', (data: { patches: Patch[] }) => {
    for (const item of data.patches) {
      patch(
        item.fileId,
        item.id,
        item.locale,
        item.value as Parameters<typeof patch>[3],
      );
    }
  });
  import.meta.hot.on('yapyak:purge', (data: { fileId: string }) => {
    purgeFile(data.fileId);
  });
}

export function useYapyak(): void {
  useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  if (import.meta.env?.DEV) {
    useSyncExternalStore(subscribeDev, getDevVersion, getDevVersion);
  }
}
