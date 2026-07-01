import type { RefOrValue } from '#types';
import type { Offset } from '#utils/geometry';

import { useRef } from 'react';

import { getScrollOffset } from '#utils/dom';
import { toValue } from '#utils/to-value';

import { useEventListener } from './use-event-listener';
import { useSynchronizedLayoutEffect } from './use-synchronized-layout-effect';
import { useWindowEventListener } from './use-window-event-listener';

export function useScrollOffsetListener(
  element: RefOrValue<HTMLElement | null>,
  callback: (scrollOffset: Offset) => void,
) {
  const latestCallbackRef = useRef(callback);
  latestCallbackRef.current = callback;

  const previousScrollOffsetRef = useRef<Offset | null>(null);

  const update = () => {
    const $element = toValue(element);
    if ($element === null) {
      return;
    }
    const nextScrollOffset = getScrollOffset($element);
    if (previousScrollOffsetRef.current?.isEqual(nextScrollOffset)) {
      return;
    }
    latestCallbackRef.current(nextScrollOffset);
    previousScrollOffsetRef.current = nextScrollOffset;
  };

  useSynchronizedLayoutEffect(update);
  useEventListener(element, 'scroll', update);
  useWindowEventListener('resize', update);
}
