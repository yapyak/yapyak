import {
  autoRegisterTracker,
  getDevVersion,
  subscribeDev,
} from 'yapyak/internal';

let active = $state(getDevVersion());

if (typeof window !== 'undefined') {
  subscribeDev(() => {
    active = getDevVersion();
  });
  autoRegisterTracker(import.meta, () => {
    void active;
  });
}
