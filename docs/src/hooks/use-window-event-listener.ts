import type { UseEventListenerOptions } from './use-event-listener';

import { useEventListener } from './use-event-listener';

export type WindowListenerEvent = keyof WindowEventMap;

export type WindowListener<K extends keyof WindowEventMap> = (
  event: WindowEventMap[K],
) => void;

export function useWindowEventListener<T extends WindowListenerEvent>(
  type: T,
  listener: WindowListener<T>,
  options?: UseEventListenerOptions,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  useEventListener(window, type, listener, options);
}
