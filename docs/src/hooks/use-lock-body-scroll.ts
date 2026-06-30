import { useEffect, useRef } from 'react';

import { getDocument } from '#utils/dom';

let scrollLockCount = 0;

export type UseLockBodyScrollOptions = {
  enabled?: boolean;
};

export function useLockBodyScroll({
  enabled = true,
}: UseLockBodyScrollOptions = {}): void {
  const isLocked = useRef(false);

  useEffect(() => {
    const doc = getDocument();

    if (enabled && !isLocked.current) {
      if (scrollLockCount === 0) {
        doc.body.style.overflow = 'clip';
      }
      scrollLockCount++;
      isLocked.current = true;
    }

    if (!enabled && isLocked.current) {
      scrollLockCount--;
      isLocked.current = false;

      if (scrollLockCount <= 0) {
        doc.body.style.overflow = '';

        if (doc.body.getAttribute('style') === '') {
          doc.body.removeAttribute('style');
        }
      }
    }

    return () => {
      if (isLocked.current) {
        scrollLockCount--;
        isLocked.current = false;

        if (scrollLockCount <= 0) {
          doc.body.style.overflow = '';
          if (doc.body.getAttribute('style') === '') {
            doc.body.removeAttribute('style');
          }
        }
      }
    };
  }, [
    enabled,
  ]);
}
