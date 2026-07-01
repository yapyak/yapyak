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

  const intervalDelayRef = useRef(delay);
  const stepIndexRef = useRef(0);

  const updateInterval = () => {
    stepIndexRef.current += 1;
    let nextInterval = delay / accelerationFactor ** stepIndexRef.current;
    nextInterval = Math.min(nextInterval, maxInterval);
    nextInterval = Math.max(nextInterval, minInterval);
    intervalDelayRef.current = nextInterval;
  };

  const intervalHandle = useIntervalHandle(
    () => {
      callback();
      updateInterval();
    },
    {
      delay: intervalDelayRef.current,
      immediate,
    },
  );

  const handlePointerEnter = () => {
    if (disabled) {
      return;
    }
    stepIndexRef.current = 0;
    intervalDelayRef.current = delay;
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
