import type { RefOrValue } from '#types';
import type {
  FocusManagerGetNodesOptions,
  FocusManagerStepOptions,
} from '#utils/focus-manager';

import { useLayoutEffect, useMemo, useRef } from 'react';

import { FocusManager } from '#utils/focus-manager';
import { toValue } from '#utils/to-value';

export type UseFocusManagerReturn = {
  find: (
    predicate: (node: HTMLElement) => boolean,
    options?: FocusManagerGetNodesOptions,
  ) => void;
  first: (options?: FocusManagerGetNodesOptions) => void;
  getNodes: (options?: FocusManagerGetNodesOptions) => HTMLElement[];
  last: (options?: FocusManagerGetNodesOptions) => void;
  next: (options?: FocusManagerStepOptions) => void;
  previous: (options?: FocusManagerStepOptions) => void;
};

export function useFocusManager(
  element: RefOrValue<HTMLElement | null>,
): UseFocusManagerReturn {
  const focusManagerRef = useRef<FocusManager | null>(null);

  useLayoutEffect(() => {
    const $element = toValue(element);

    if ($element) {
      focusManagerRef.current = new FocusManager($element);
    } else {
      focusManagerRef.current = null;
    }
  }, [
    element,
  ]);

  return useMemo<UseFocusManagerReturn>(
    () => ({
      find: (predicate, options) => {
        focusManagerRef.current?.find(predicate, options);
      },
      first: (options) => {
        focusManagerRef.current?.first(options);
      },
      getNodes: (options) => focusManagerRef.current?.getNodes(options) ?? [],
      last: (options) => {
        focusManagerRef.current?.last(options);
      },
      next: (options) => {
        focusManagerRef.current?.next(options);
      },
      previous: (options) => {
        focusManagerRef.current?.previous(options);
      },
    }),
    [],
  );
}
