import type { RefOrValue } from '#types';

import { useState } from 'react';

import { Offset } from '#utils/geometry';

import { useScrollOffsetListener } from './use-scroll-offset-listener';

export function useScrollOffset(element: RefOrValue<HTMLElement | null>) {
  const [scrollOffset, setScrollOffset] = useState(() => Offset.zero());

  useScrollOffsetListener(element, setScrollOffset);

  return scrollOffset;
}
