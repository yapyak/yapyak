import { useEffect } from 'react';

import { useControllableState } from './use-controllable-state';

export type UseDrawerOptions = {
  onClose?: () => void;
  onOpen?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
};

export type UseDrawerReturn = {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  toggle: () => void;
};

export function useDrawer(
  initialOpen = false,
  options: UseDrawerOptions = {},
): UseDrawerReturn {
  const { onClose, onOpen, onOpenChange, open: controlledOpen } = options;

  const [isOpen = false, setIsOpen] = useControllableState<boolean>({
    defaultValue: initialOpen,
    onChange: onOpenChange,
    value: controlledOpen,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [
    isOpen,
  ]);

  const open = (): void => {
    setIsOpen(true);
  };

  const close = (): void => {
    setIsOpen(false);
  };

  const toggle = (): void => {
    setIsOpen((prev) => !prev);
  };

  return {
    close,
    isOpen,
    open,
    toggle,
  };
}
