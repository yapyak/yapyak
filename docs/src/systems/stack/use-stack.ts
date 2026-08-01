import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { useAnimateContext } from '../animate';
import { useStackContext } from './use-stack-context';

export type UseStackOptions = {
  onActiveChange?: (isActive: boolean) => void;
};

export type UseStackReturn = {
  active: boolean;
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

  const [isMounted, setIsMounted] = useState(false);
  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  const isTopOfStack = stackContext.entries.at(-1)?.id === id;
  const isActive = isMounted ? isTopOfStack : true;

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useLayoutEffect(() => {
    onActiveChange?.(isTopOfStack);
  }, [
    isTopOfStack,
  ]);

  return {
    active: isActive,
  };
}
