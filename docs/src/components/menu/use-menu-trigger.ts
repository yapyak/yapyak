import type { KeyboardEvent, RefObject } from 'react';

import { useId, useRef } from 'react';

import { useDrawer } from '#hooks/use-drawer';

export type UseMenuTriggerOptions = {
  initialOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
};

export type UseMenuTriggerReturn = {
  open: boolean;
  menuProps: {
    id: string;
    onClose: () => void;
    targetElement: RefObject<HTMLButtonElement | null>;
  };
  triggerProps: {
    'aria-controls': string | undefined;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    ref: RefObject<HTMLButtonElement | null>;
  };
};

export function useMenuTrigger(
  options: UseMenuTriggerOptions = {},
): UseMenuTriggerReturn {
  const { initialOpen = false, onClose, onOpen } = options;

  const targetElement = useRef<HTMLButtonElement>(null);
  const id = useId();
  const drawer = useDrawer(initialOpen, {
    onClose,
    onOpen,
  });

  const handleClick = () => {
    if (drawer.isOpen) {
      drawer.close();
      return;
    }
    drawer.open();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (drawer.isOpen) {
      return;
    }
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();
      drawer.open();
    }
  };

  return {
    menuProps: {
      id,
      onClose: drawer.close,
      targetElement,
    },
    open: drawer.isOpen,
    triggerProps: {
      'aria-controls': drawer.isOpen ? id : undefined,
      'aria-expanded': drawer.isOpen,
      'aria-haspopup': 'menu',
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      ref: targetElement,
    },
  };
}
