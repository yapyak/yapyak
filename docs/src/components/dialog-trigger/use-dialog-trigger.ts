import type { RefObject } from 'react';

import { useId, useRef } from 'react';

import { useDrawer } from '#hooks/use-drawer';
import { useEventListener } from '#hooks/use-event-listener';
import { useOnRouteRendered } from '#hooks/use-on-route-rendered';
import { getDocument } from '#utils/dom';

export type DialogShortcut = 'mod+k';

export type UseDialogTriggerOptions = {
  initialOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  shortcut?: DialogShortcut;
};

export type UseDialogTriggerReturn = {
  dialogProps: {
    id: string;
    onClose: () => void;
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
  const { initialOpen = false, onClose, onOpen, shortcut } = options;

  const targetElement = useRef<HTMLButtonElement>(null);
  const id = useId();
  const drawer = useDrawer(initialOpen, {
    onClose,
    onOpen,
  });

  useOnRouteRendered(drawer.close);

  useEventListener(
    shortcut === undefined || typeof document === 'undefined'
      ? null
      : getDocument(),
    'keydown',
    (event) => {
      if (shortcut !== undefined && matchesShortcut(event, shortcut)) {
        event.preventDefault();
        drawer.open();
      }
    },
  );

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
  };

  return {
    dialogProps,
    isOpen: drawer.isOpen,
    triggerProps,
  };
}

function matchesShortcut(
  event: KeyboardEvent,
  shortcut: DialogShortcut,
): boolean {
  const [modifier, key] = shortcut.split('+');
  const hasModifier = modifier === 'mod' && (event.metaKey || event.ctrlKey);
  return hasModifier && event.key.toLowerCase() === key;
}
