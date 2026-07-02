import { useLocation } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { KEY_MAP } from '#constants';

import { useDocumentEventListener } from './use-document-event-listener';
import { useLockBodyScroll } from './use-lock-body-scroll';
import { useMediaQuery } from './use-media-query';

export type UseMobileMenuReturn = {
  isOpen: boolean;
  toggle: () => void;
};

export function useMobileMenu(): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useLockBodyScroll({
    enabled: isOpen,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    setIsOpen(false);
  }, [
    location,
  ]);

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
