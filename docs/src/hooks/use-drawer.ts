import { useEffect, useState } from 'react';

export type UseDrawerOptions = {
  onClose?: () => void;
  onOpen?: () => void;
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
  const { onClose, onOpen } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);

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
