import type { RefOrValue } from '#types';

import { useState } from 'react';

import { Rect } from '#utils/geometry';

import { useRectListener } from './use-rect-listener';

export function useRect(element: RefOrValue<HTMLElement | null>): Rect {
  const [rect, setRect] = useState(() => Rect.zero());

  useRectListener(element, setRect);

  return rect;
}
