import type { KeyboardEvent, RefObject } from 'react';

import { useEffect, useRef } from 'react';

const ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

export type UseMenuNavigationReturn = {
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  ref: RefObject<HTMLDivElement | null>;
};

export function useMenuNavigation(): UseMenuNavigationReturn {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const $element = element.current;
    if ($element === null) {
      return;
    }
    const checkedItem = $element.querySelector<HTMLDivElement>(
      '[aria-checked="true"]',
    );
    const firstItem = $element.querySelector<HTMLDivElement>(ITEM_SELECTOR);
    (checkedItem ?? firstItem)?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const $element = element.current;
    if ($element === null) {
      return;
    }
    const items = Array.from(
      $element.querySelectorAll<HTMLDivElement>(ITEM_SELECTOR),
    );
    if (items.length === 0) {
      return;
    }
    const currentIndex = items.indexOf(
      document.activeElement as HTMLDivElement,
    );

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex =
        currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
      return;
    }
  };

  return {
    onKeyDown: handleKeyDown,
    ref: element,
  };
}
