import type { RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

const WHEEL_IDLE_DELAY = 100;

export function useIsWheelScrolling(ref: RefObject<HTMLDivElement | null>) {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<number>(undefined);

  useEffect(() => {
    const $element = ref.current;
    if ($element === null) {
      return;
    }

    const handleWheel = () => {
      setIsScrolling(true);
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, WHEEL_IDLE_DELAY);
    };

    $element.addEventListener('wheel', handleWheel, {
      passive: true,
    });

    return () => {
      $element.removeEventListener('wheel', handleWheel);
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [
    ref,
  ]);

  return isScrolling;
}
