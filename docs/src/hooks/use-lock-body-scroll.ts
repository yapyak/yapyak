import { useEffect, useRef } from 'react';

import { getDocument } from '#utils/dom';

let scrollLockCount = 0;

export type UseLockBodyScrollOptions = {
  enabled?: boolean;
};

export function useLockBodyScroll({
  enabled = true,
}: UseLockBodyScrollOptions = {}): void {
  const isLockedRef = useRef(false);

  useEffect(() => {
    const doc = getDocument();

    if (enabled && !isLockedRef.current) {
      if (scrollLockCount === 0) {
        doc.body.style.overflow = 'clip';
      }
      scrollLockCount++;
      isLockedRef.current = true;
    }

    if (!enabled && isLockedRef.current) {
      scrollLockCount--;
      isLockedRef.current = false;

      if (scrollLockCount <= 0) {
        doc.body.style.overflow = '';

        if (doc.body.getAttribute('style') === '') {
          doc.body.removeAttribute('style');
        }
      }
    }

    return () => {
      if (isLockedRef.current) {
        scrollLockCount--;
        isLockedRef.current = false;

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
