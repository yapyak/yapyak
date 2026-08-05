import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#primitives/box';

import styles from './route-announcer.module.css';

export function RouteAnnouncer() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const [message, setMessage] = useState('');
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const mainElement = document.querySelector('main');
      const headingElement = mainElement?.querySelector('h1');
      const label =
        headingElement?.textContent?.trim() || document.title || pathname;
      setMessage(
        t('Navigated to {label}', {
          label,
        }),
      );
      if (mainElement instanceof HTMLElement) {
        mainElement.setAttribute('tabindex', '-1');
        mainElement.addEventListener(
          'blur',
          () => {
            mainElement.removeAttribute('tabindex');
          },
          {
            once: true,
          },
        );
        mainElement.focus({
          preventScroll: true,
        });
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    pathname,
  ]);

  return (
    <Box
      aria-atomic="true"
      aria-live="assertive"
      className={styles.RouteAnnouncer}
    >
      {message}
    </Box>
  );
}
