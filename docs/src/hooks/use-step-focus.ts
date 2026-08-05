import type { KeyboardEvent, RefObject } from 'react';

import { useLayoutEffect, useRef, useState } from 'react';

import { isCaretAtEnd } from '#utils/is-caret-at-end';
import { isCaretAtStart } from '#utils/is-caret-at-start';
import { isTextBox } from '#utils/is-text-box';

import { useFocusManager } from './use-focus-manager';
import { useTimeoutHandle } from './use-timeout-handle';

export type StepFocusOrientation = 'horizontal' | 'vertical';

export type UseStepFocusOptions = {
  loopable?: boolean;
  orientation?: StepFocusOrientation;
  rovingTabIndex?: boolean;
  searchable?: boolean;
};

export type UseStepFocusReturn<T extends HTMLElement = HTMLElement> = {
  props: {
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    ref: RefObject<T | null>;
  };
};

type KeyboardAction = 'first' | 'last' | 'next' | 'previous' | 'search' | null;

export function useStepFocus<T extends HTMLElement = HTMLElement>(
  options: UseStepFocusOptions = {},
): UseStepFocusReturn<T> {
  const {
    loopable = false,
    orientation,
    rovingTabIndex = false,
    searchable = false,
  } = options;

  const [search, setSearch] = useState('');

  const element = useRef<T | null>(null);

  const focusManager = useFocusManager(element);

  const searchTimeout = useTimeoutHandle(
    () => {
      setSearch('');
    },
    {
      delay: 500,
    },
  );

  useLayoutEffect(() => {
    if (!rovingTabIndex) {
      return;
    }

    const $element = element.current;

    if ($element === null) {
      return;
    }

    const sync = (focused?: HTMLElement) => {
      const items = focusManager.getNodes();
      const target =
        focused ?? items.find((item) => item.tabIndex === 0) ?? items[0];
      for (const item of items) {
        item.tabIndex = item === target ? 0 : -1;
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      sync(event.target as HTMLElement);
    };

    sync();

    $element.addEventListener('focusin', handleFocusIn);
    const observer = new MutationObserver(() => {
      sync();
    });
    observer.observe($element, {
      childList: true,
      subtree: true,
    });

    return () => {
      $element.removeEventListener('focusin', handleFocusIn);
      observer.disconnect();
    };
  }, [
    rovingTabIndex,
    focusManager.getNodes,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const action = getAction(event, orientation, searchable);
    if (!action) {
      return;
    }
    event.preventDefault();

    const tabbableOnly = !rovingTabIndex;

    switch (action) {
      case 'first':
        focusManager.first({
          tabbableOnly,
        });
        break;
      case 'last':
        focusManager.last({
          tabbableOnly,
        });
        break;
      case 'next':
        focusManager.next({
          loop: loopable,
          tabbableOnly,
        });
        break;
      case 'previous':
        focusManager.previous({
          loop: loopable,
          tabbableOnly,
        });
        break;
      case 'search': {
        if (search.length > 0) {
          event.stopPropagation();
        }
        const nextSearch = search + event.key;
        setSearch(nextSearch);
        searchTimeout.start();
        focusManager.find((item) => findByValue(item, nextSearch), {
          tabbableOnly,
        });
        break;
      }
      default:
        break;
    }
  };

  return {
    props: {
      onKeyDown: handleKeyDown,
      ref: element,
    },
  };
}

function findByValue(element: HTMLElement, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  const text = element.textContent;
  if (!text) {
    return false;
  }
  return text.toLowerCase().includes(trimmed.toLowerCase());
}

function getAction(
  event: KeyboardEvent<HTMLElement>,
  orientation: StepFocusOrientation | undefined,
  searchable: boolean,
): KeyboardAction {
  const { key, metaKey } = event;
  const allowHorizontal = orientation !== 'vertical';
  const allowVertical = orientation !== 'horizontal';

  if (key === 'Home' || (metaKey && key === 'ArrowUp')) {
    return 'first';
  }

  if (key === 'End' || (metaKey && key === 'ArrowDown')) {
    return 'last';
  }

  if (
    (allowVertical && key === 'ArrowUp' && shouldGoPrevious(event)) ||
    (allowHorizontal && key === 'ArrowLeft' && shouldGoPrevious(event))
  ) {
    return 'previous';
  }

  if (
    (allowVertical && key === 'ArrowDown' && shouldGoNext(event)) ||
    (allowHorizontal && key === 'ArrowRight' && shouldGoNext(event))
  ) {
    return 'next';
  }

  if (key.length === 1 && !metaKey && searchable) {
    return 'search';
  }

  return null;
}

function shouldGoNext(event: KeyboardEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  return isTextBox(target) ? isCaretAtEnd(target) : true;
}

function shouldGoPrevious(event: KeyboardEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  return isTextBox(target) ? isCaretAtStart(target) : true;
}
