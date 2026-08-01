import type { UseEventListenerOptions } from './use-event-listener';

import { useEventListener } from './use-event-listener';

export type WindowListenerEvent = keyof WindowEventMap;

export type WindowListener<T extends keyof WindowEventMap> = (
  event: WindowEventMap[T],
) => void;

export function useWindowEventListener<T extends WindowListenerEvent>(
  type: T,
  listener: WindowListener<T>,
  options?: UseEventListenerOptions,
): void {
  useEventListener(
    typeof window === 'undefined' ? null : window,
    type,
    listener,
    options,
  );
}
