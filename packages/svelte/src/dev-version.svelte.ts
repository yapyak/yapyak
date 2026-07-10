import {
  autoRegisterTracker,
  autoSubscribeDev,
  getDevVersion,
} from 'yapyak/internal';

let active = $state(getDevVersion());

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  autoSubscribeDev(import.meta, () => {
    active = getDevVersion();
  });
  autoRegisterTracker(import.meta, () => {
    void active;
  });
}
