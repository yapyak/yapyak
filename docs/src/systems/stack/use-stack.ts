import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { useAnimateContext } from '#systems/animate';

import { useStackContext } from './use-stack-context';

export type UseStackOptions = {
  onActiveChange?: (isActive: boolean) => void;
};

export type UseStackReturn = {
  isActive: boolean;
};

export function useStack({
  onActiveChange,
}: UseStackOptions = {}): UseStackReturn {
  const id = useId();

  const lastFocusedElement = useRef<Element | null>(
    typeof document === 'undefined' ? null : document.activeElement,
  );

  const stackContext = useStackContext();
  const animateState = useAnimateContext();
  const isLeaving = animateState === 'exit';

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    if (isLeaving) {
      return;
    }
    return stackContext.register(id, lastFocusedElement.current);
  }, [
    isLeaving,
  ]);

  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const isActiveComputed = mounted
    ? stackContext.entries.at(-1)?.id === id
    : true;

  const isActive = stackContext.entries.at(-1)?.id === id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useLayoutEffect(() => {
    onActiveChange?.(isActive);
  }, [
    isActive,
  ]);

  return {
    isActive: isActiveComputed,
  };
}
