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
  const callbackRef = useRef(callback);

  const rectRef = useRef<null | Rect>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [
    callback,
  ]);

  const update = () => {
    const $element = toValue(element);

    if ($element) {
      const newRect = getRect($element);

      if (rectRef.current?.isEqual(newRect)) {
        return;
      }

      callbackRef.current(newRect);

      rectRef.current = newRect;
    }
  };

  usePositionListener(element, update);
}
