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
  const focusManager = useRef<FocusManager | null>(null);

  useLayoutEffect(() => {
    const $element = toValue(element);

    if ($element) {
      focusManager.current = new FocusManager($element);
    } else {
      focusManager.current = null;
    }
  }, [
    element,
  ]);

  return useMemo<UseFocusManagerReturn>(
    () => ({
      find: (predicate, options) => {
        focusManager.current?.find(predicate, options);
      },
      first: (options) => {
        focusManager.current?.first(options);
      },
      getNodes: (options) => focusManager.current?.getNodes(options) ?? [],
      last: (options) => {
        focusManager.current?.last(options);
      },
      next: (options) => {
        focusManager.current?.next(options);
      },
      previous: (options) => {
        focusManager.current?.previous(options);
      },
    }),
    [],
  );
}
