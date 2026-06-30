import type { RefOrValue } from '#types';
import type { Rect } from '#utils/geometry';

import { useEffect, useLayoutEffect, useRef } from 'react';

import { getRect } from '#utils/dom';
import { toValue } from '#utils/to-value';

type Listener = () => void;

const listeners = new Map<HTMLElement, Set<Listener>>();

let resizeObserver: null | ResizeObserver = null;
let mutationObserver: MutationObserver | null = null;

export function usePositionListener(
  element: RefOrValue<HTMLElement | null>,
  callback: () => void,
): void {
  const callbackRef = useRef(callback);
  const lastRect = useRef<null | Rect>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [
    callback,
  ]);

  const update = () => {
    const $element = toValue(element);
    if (!$element) {
      return;
    }

    const next = getRect($element);
    if (lastRect.current?.isEqual(next)) {
      return;
    }

    lastRect.current = next;
    callbackRef.current();
  };

  useLayoutEffect(update, [
    element,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    const $element = toValue(element);
    if (!$element) {
      return;
    }

    return observeElement($element, update);
  }, [
    element,
  ]);
}

function observeElement($element: HTMLElement, callback: Listener): () => void {
  if (listeners.size === 0) {
    startGlobalObservers();
  }

  if (!listeners.has($element)) {
    listeners.set($element, new Set());
    resizeObserver?.observe($element);
  }

  listeners.get($element)?.add(callback);

  return () => {
    const set = listeners.get($element);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        listeners.delete($element);
        resizeObserver?.unobserve($element);
      }
    }

    if (listeners.size === 0) {
      stopGlobalObservers();
    }
  };
}

function startGlobalObservers() {
  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      triggerAll();
    });
  }

  if (!mutationObserver && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      triggerAll();
    });

    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  window.addEventListener('resize', triggerAll);
  window.addEventListener('scroll', triggerAll, {
    capture: true,
  });
}

function stopGlobalObservers() {
  resizeObserver?.disconnect();
  resizeObserver = null;

  mutationObserver?.disconnect();
  mutationObserver = null;

  window.removeEventListener('resize', triggerAll);
  window.removeEventListener('scroll', triggerAll, {
    capture: true,
  });
}

function triggerAll() {
  listeners.forEach((fns) => {
    fns.forEach((fn) => {
      fn();
    });
  });
}
