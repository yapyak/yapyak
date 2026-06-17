import type { Ref } from 'vue';

import { customRef } from 'vue';
import {
  autoRegisterTracker,
  autoSubscribeDev,
  getDevVersion,
} from 'yapyak/internal';

const devVersion: Ref<number> = customRef<number>((track, trigger) => {
  if (typeof window !== 'undefined') {
    autoSubscribeDev(import.meta, trigger);
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
