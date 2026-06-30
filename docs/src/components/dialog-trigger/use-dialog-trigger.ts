import type { RefObject } from 'react';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useId, useRef } from 'react';

import { useDrawer } from '#hooks/use-drawer';

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

  const location = useLocation();
  const initialPathnameRef = useRef(location.pathname);
  const initialHashRef = useRef(location.hash);

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    if (
      location.pathname !== initialPathnameRef.current ||
      location.hash !== initialHashRef.current
    ) {
      drawer.close();
      initialPathnameRef.current = location.pathname;
      initialHashRef.current = location.hash;
    }
  }, [
    location.pathname,
    location.hash,
  ]);

  const triggerProps = {
    'aria-controls': drawer.isOpen ? id : undefined,
    'aria-expanded': drawer.isOpen,
    'aria-haspopup': 'dialog' as const,
    onClick: (): void => {
      drawer.open();
    },
    ref: targetElement,
  };

  const dialogProps = {
    id,
    onClose: (): void => {
      drawer.close();
    },
    open: drawer.isOpen,
  };

  return {
    dialogProps,
    isOpen: drawer.isOpen,
    triggerProps,
  };
}
