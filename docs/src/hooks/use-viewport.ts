import { useLayoutEffect, useState } from 'react';

import { getViewport } from '#utils/dom';
import { Viewport } from '#utils/geometry';

import { useEventListener } from './use-event-listener';

export function useViewport() {
  const [viewport, setViewport] = useState(() => Viewport.zero());

  const update = () => {
    const next = getViewport();
    setViewport((prev) => (prev.isEqual(next) ? prev : next));
  };

  const target = typeof window === 'undefined' ? null : window.visualViewport;

  useLayoutEffect(update, []);
  useEventListener(target, 'resize', update);
  useEventListener(target, 'scroll', update);

  return viewport;
}
