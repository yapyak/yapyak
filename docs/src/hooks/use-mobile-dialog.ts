import { useEffect, useMemo, useState } from 'react';

import { KEY_MAP } from '#constants';

import { useDocumentEventListener } from './use-document-event-listener';
import { useLockBodyScroll } from './use-lock-body-scroll';
import { useMediaQuery } from './use-media-query';
import { useOnRouteChange } from './use-on-route-change';

export type UseMobileDialogReturn = {
  isOpen: boolean;
  toggle: () => void;
};

export function useMobileDialog(): UseMobileDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useLockBodyScroll({
    enabled: isOpen,
  });

  useOnRouteChange(() => {
    setIsOpen(false);
  });

  useEffect(() => {
    if (isDesktop) {
      setIsOpen(false);
    }
  }, [
    isDesktop,
  ]);

  useDocumentEventListener('keydown', (event) => {
    if (isOpen && event.key === KEY_MAP.escape) {
      setIsOpen(false);
    }
  });

  return useMemo(
    () => ({
      isOpen,
      toggle: () => {
        setIsOpen((open) => !open);
      },
    }),
    [
      isOpen,
    ],
  );
}
