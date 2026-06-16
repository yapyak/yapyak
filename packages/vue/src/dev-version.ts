import type { Ref } from 'vue';

import { customRef } from 'vue';
import {
  autoRegisterTracker,
  getDevVersion,
  setCatalogEntry,
  subscribeDev,
} from 'yapyak/internal';

type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | unknown[];
};

const devVersion: Ref<number> = customRef<number>((track, trigger) => {
  if (typeof window !== 'undefined') {
    subscribeDev(trigger);
    autoRegisterTracker(import.meta, () => {
      void devVersion.value;
    });
    if (import.meta.hot?.on) {
      import.meta.hot.on('yapyak:patch', (data: { patches: Patch[] }) => {
        for (const item of data.patches) {
          setCatalogEntry(
            item.fileId,
            item.id,
            item.locale,
            item.value as Parameters<typeof setCatalogEntry>[3],
          );
        }
      });
    }
  }
  return {
    get(): number {
      track();
      return getDevVersion();
    },
    set(): void {},
  };
});
