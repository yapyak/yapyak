import { useLayoutEffect, useState } from 'react';

import { getWindowRect } from '#utils/dom';
import { Rect } from '#utils/geometry';

import { useWindowEventListener } from './use-window-event-listener';

export function useWindowRect() {
  const [rect, setRect] = useState(() => Rect.zero());

  const update = () => {
    const newRect = getWindowRect();
    setRect((prev) => (prev.isEqual(newRect) ? prev : newRect));
  };

  useLayoutEffect(update, []);
  useWindowEventListener('resize', update);

  return rect;
}
