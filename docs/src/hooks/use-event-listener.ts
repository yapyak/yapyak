import type { RefOrValue } from '#types';

import { useEffect, useRef } from 'react';

import { toValue } from '#utils/to-value';

export type UseEventListenerOptions = {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
};

type EventMap<T> = T extends Window
  ? WindowEventMap
  : T extends Document
    ? DocumentEventMap
    : T extends HTMLElement
      ? HTMLElementEventMap
      : Record<string, Event>;

export function useEventListener<
  T extends EventTarget,
  K extends keyof EventMap<T>,
>(
  target: RefOrValue<null | T>,
  type: K,
  listener: (event: EventMap<T>[K]) => void,
  {
    capture = false,
    passive = false,
    once = false,
  }: UseEventListenerOptions = {},
): void {
  const stableListener = useRef(listener);

  useEffect(() => {
    stableListener.current = listener;
  }, [
    listener,
  ]);

  useEffect(() => {
    const $target = toValue(target);

    if (!$target) {
      return;
    }

    const handle = (event: EventMap<T>[K]) => {
      stableListener.current(event);
    };

    $target.addEventListener(type as string, handle as EventListener, {
      capture,
      once,
      passive,
    });

    return () => {
      $target.removeEventListener(type as string, handle as EventListener, {
        capture,
      });
    };
  }, [
    capture,
    target,
    once,
    passive,
    type,
  ]);
}
