import { useEffect, useRef } from 'react';

import { getDocument } from '#utils/dom';

let scrollLockCount = 0;

function isTouchWithinScrollable(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;

  while (node) {
    if (node instanceof HTMLElement) {
      const { overflowY } = getComputedStyle(node);

      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      ) {
        return true;
      }
    }

    node = node.parentElement;
  }

  return false;
}

function preventBackgroundTouch(event: TouchEvent): void {
  if (event.touches.length === 1 && !isTouchWithinScrollable(event.target)) {
    event.preventDefault();
  }
}

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
        doc.addEventListener('touchmove', preventBackgroundTouch, {
          passive: false,
        });
      }
      scrollLockCount++;
      isLockedRef.current = true;
    }

    return () => {
      if (isLockedRef.current) {
        scrollLockCount--;
        isLockedRef.current = false;

        if (scrollLockCount <= 0) {
          doc.body.style.overflow = '';
          doc.removeEventListener('touchmove', preventBackgroundTouch);

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
