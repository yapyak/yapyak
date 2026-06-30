import type { RefOrValue } from '#types';
import type { Rect } from '#utils/geometry';

import { useEffect, useRef } from 'react';

import { getRect } from '#utils/dom';
import { toValue } from '#utils/to-value';

import { usePositionListener } from './use-position-listener';

export function useRectListener(
  element: RefOrValue<HTMLElement | null>,
  callback: (rect: Rect) => void,
): void {
  const stableCallback = useRef(callback);

  const rect = useRef<null | Rect>(null);

  useEffect(() => {
    stableCallback.current = callback;
  }, [
    callback,
  ]);

  const update = () => {
    const $element = toValue(element);

    if ($element) {
      const newRect = getRect($element);

      if (rect.current?.isEqual(newRect)) {
        return;
      }

      stableCallback.current(newRect);

      rect.current = newRect;
    }
  };

  usePositionListener(element, update);
}
