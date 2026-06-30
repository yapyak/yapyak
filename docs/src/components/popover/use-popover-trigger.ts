import type { RefObject } from 'react';

import { useId, useRef } from 'react';

import { useDrawer } from '#hooks/use-drawer';

export type UsePopoverTriggerOptions = {
  initialOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
};

export type UsePopoverTriggerReturn = {
  isOpen: boolean;
  popoverProps: {
    id: string;
    onClose: () => void;
    targetElement: RefObject<HTMLButtonElement | null>;
  };
  triggerProps: {
    'aria-controls': string | undefined;
    'aria-expanded': boolean;
    onClick: () => void;
    ref: RefObject<HTMLButtonElement | null>;
  };
};

export function usePopoverTrigger(
  options: UsePopoverTriggerOptions = {},
): UsePopoverTriggerReturn {
  const { initialOpen = false, onClose, onOpen } = options;

  const targetElement = useRef<HTMLButtonElement>(null);
  const id = useId();
  const drawer = useDrawer(initialOpen, {
    onClose,
    onOpen,
  });

  const triggerProps = {
    'aria-controls': drawer.isOpen ? id : undefined,
    'aria-expanded': drawer.isOpen,
    onClick: (): void => {
      drawer.open();
    },
    ref: targetElement,
  };

  const popoverProps = {
    id,
    onClose: (): void => {
      drawer.close();
    },
    targetElement,
  };

  return {
    isOpen: drawer.isOpen,
    popoverProps,
    triggerProps,
  };
}
