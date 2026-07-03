import { useEffect, useRef, useState } from 'react';

const BLINK_DURATION_MS = 160;

export function useMenuItemBlink(onComplete: () => void) {
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<number>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const blink = () => {
    setIsBlinking(true);
    timeoutRef.current = window.setTimeout(onComplete, BLINK_DURATION_MS);
  };

  return {
    blink,
    isBlinking,
  };
}
