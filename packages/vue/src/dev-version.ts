import type { Ref } from 'vue';

import { customRef } from 'vue';
import {
  autoRegisterTracker,
  getDevVersion,
  subscribeDev,
} from 'yapyak/internal';

const devVersion: Ref<number> = customRef<number>((track, trigger) => {
  if (typeof window !== 'undefined') {
    subscribeDev(trigger);
    autoRegisterTracker(import.meta, () => {
      void devVersion.value;
    });
  }
  return {
    get(): number {
      track();
      return getDevVersion();
    },
    set(): void {},
  };
});
