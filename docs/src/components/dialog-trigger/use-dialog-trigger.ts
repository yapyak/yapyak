import type { RefObject } from 'react';

import { useId, useRef } from 'react';

import { useDrawer } from '#hooks/use-drawer';
import { useOnRouteChange } from '#hooks/use-on-route-change';

export type UseDialogTriggerOptions = {
  initialOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
};

export type UseDialogTriggerReturn = {
  dialogProps: {
    id: string;
    onClose: () => void;
    open: boolean;
  };
  isOpen: boolean;
  triggerProps: {
    'aria-controls': string | undefined;
    'aria-expanded': boolean;
    'aria-haspopup': 'dialog';
    onClick: () => void;
    ref: RefObject<HTMLButtonElement | null>;
  };
};

export function useDialogTrigger(
  options: UseDialogTriggerOptions = {},
): UseDialogTriggerReturn {
  const { initialOpen = false, onClose, onOpen } = options;

  const targetElement = useRef<HTMLButtonElement>(null);
  const id = useId();
  const drawer = useDrawer(initialOpen, {
    onClose,
    onOpen,
  });

  useOnRouteChange(drawer.close);

  const handleTriggerClick = () => {
    drawer.open();
  };

  const handleDialogClose = () => {
    drawer.close();
  };

  const triggerProps = {
    'aria-controls': drawer.isOpen ? id : undefined,
    'aria-expanded': drawer.isOpen,
    'aria-haspopup': 'dialog' as const,
    onClick: handleTriggerClick,
    ref: targetElement,
  };

  const dialogProps = {
    id,
    onClose: handleDialogClose,
    open: drawer.isOpen,
  };

  return {
    dialogProps,
    isOpen: drawer.isOpen,
    triggerProps,
  };
}
