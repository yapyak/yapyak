import { useEffect, useRef } from 'react';

import { useLatest } from './use-latest';

export type UseTimeoutHandleOptions = {
  delay: number;
};

export type UseTimeoutHandleReturn = {
  start: () => void;
  stop: () => void;
};

export function useTimeoutHandle(
  callback: () => void,
  options: UseTimeoutHandleOptions,
): UseTimeoutHandleReturn {
  const { delay } = options;

  const latestCallback = useLatest(callback);
  const timeoutRef = useRef<number>(undefined);

  const stop = () => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };

  const start = () => {
    stop();
    timeoutRef.current = window.setTimeout(() => {
      latestCallback.current();
    }, delay);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    start,
    stop,
  };
}
