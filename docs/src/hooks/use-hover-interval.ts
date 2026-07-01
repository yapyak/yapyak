import { useRef } from 'react';

import { useIntervalHandle } from './use-interval-handle';

export type UseHoverIntervalOptions = {
  accelerationFactor?: number;
  delay: number;
  disabled?: boolean;
  immediate?: boolean;
  maxInterval?: number;
  minInterval?: number;
};

export type UseHoverIntervalReturn = {
  hoverIntervalProps: {
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  };
};

export function useHoverInterval(
  callback: () => void,
  options: UseHoverIntervalOptions,
): UseHoverIntervalReturn {
  const {
    accelerationFactor = 1.1,
    delay,
    disabled = false,
    immediate = false,
    maxInterval = 1000,
    minInterval = 1,
  } = options;

  const intervalDelay = useRef(delay);
  const stepIndex = useRef(0);

  const updateInterval = () => {
    stepIndex.current += 1;
    let nextInterval = delay / accelerationFactor ** stepIndex.current;
    nextInterval = Math.min(nextInterval, maxInterval);
    nextInterval = Math.max(nextInterval, minInterval);
    intervalDelay.current = nextInterval;
  };

  const intervalHandle = useIntervalHandle(
    () => {
      callback();
      updateInterval();
    },
    {
      delay: intervalDelay.current,
      immediate,
    },
  );

  const handlePointerEnter = () => {
    if (disabled) {
      return;
    }
    stepIndex.current = 0;
    intervalDelay.current = delay;
    intervalHandle.start();
  };

  const handlePointerLeave = () => {
    if (disabled) {
      return;
    }
    intervalHandle.stop();
  };

  return {
    hoverIntervalProps: {
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
  };
}
