import type { RefOrValue } from '#types';
import type { AnchoredPositionOptions } from '#utils/geometry';

import { useMemo } from 'react';

import { AnchoredPosition } from '#utils/geometry';

import { useRect } from './use-rect';
import { useWindowRect } from './use-window-rect';

export type UseAnchoredPositionOptions = AnchoredPositionOptions;

export function useAnchoredPosition(
  element: RefOrValue<HTMLElement | null>,
  targetElement: RefOrValue<HTMLElement | null>,
  {
    alignment,
    arrow,
    arrowSafeOffset,
    arrowSize = 16,
    margin,
    offset,
    placement,
    restrain,
  }: UseAnchoredPositionOptions = {},
): AnchoredPosition {
  const rect = useRect(element);
  const targetRect = useRect(targetElement);
  const windowRect = useWindowRect();

  return useMemo(
    () =>
      new AnchoredPosition(rect, targetRect, windowRect, {
        alignment,
        arrow,
        arrowSafeOffset,
        arrowSize,
        margin,
        offset,
        placement,
        restrain,
      }),
    [
      alignment,
      arrow,
      arrowSize,
      arrowSafeOffset,
      margin,
      offset,
      placement,
      rect,
      restrain,
      targetRect,
      windowRect,
    ],
  );
}
