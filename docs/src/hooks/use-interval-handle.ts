import { useLatest } from './use-latest';
import { useTimeoutHandle } from './use-timeout-handle';

export type UseIntervalHandleOptions = {
  delay: number;
  immediate?: boolean;
};

export type UseIntervalHandleReturn = {
  start: () => void;
  stop: () => void;
};

export function useIntervalHandle(
  callback: () => void,
  options: UseIntervalHandleOptions,
): UseIntervalHandleReturn {
  const { delay, immediate = false } = options;

  const latestCallback = useLatest(callback);

  const timeoutHandle = useTimeoutHandle(
    () => {
      latestCallback.current();
      timeoutHandle.start();
    },
    {
      delay,
    },
  );

  const start = () => {
    timeoutHandle.stop();
    if (immediate) {
      latestCallback.current();
    }
    timeoutHandle.start();
  };

  const stop = () => {
    timeoutHandle.stop();
  };

  return {
    start,
    stop,
  };
}
