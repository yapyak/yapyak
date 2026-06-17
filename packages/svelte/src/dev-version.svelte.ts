import {
  autoRegisterTracker,
  autoSubscribeDev,
  getDevVersion,
} from 'yapyak/internal';

let active = $state(getDevVersion());

if (typeof window !== 'undefined') {
  autoSubscribeDev(import.meta, () => {
    active = getDevVersion();
  });
  autoRegisterTracker(import.meta, () => {
    void active;
  });
}
