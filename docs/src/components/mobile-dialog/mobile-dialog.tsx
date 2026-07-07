import type { BoxProps } from '#primitives/box';

import { useEffect, useRef } from 'react';

import { KEY_MAP } from '#constants';
import { useDocumentEventListener } from '#hooks/use-document-event-listener';
import { useEventListener } from '#hooks/use-event-listener';
import { useLockBodyScroll } from '#hooks/use-lock-body-scroll';
import { useMediaQuery } from '#hooks/use-media-query';
import { useOnRouteChange } from '#hooks/use-on-route-change';
import { Box } from '#primitives/box';

import styles from './mobile-dialog.module.css';

export type MobileDialogProps = BoxProps & {
  onClose: () => void;
};

export function MobileDialog(props: MobileDialogProps) {
  const { children, className, onClose, ref, ...restProps } = props;
  const dialogElement = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const viewport = typeof window === 'undefined' ? null : window.visualViewport;

  const syncKeyboardInset = () => {
    const element = dialogElement.current;
    if (!viewport || !element) {
      return;
    }
    const inset = Math.max(
      0,
      window.innerHeight - viewport.height - viewport.offsetTop,
    );
    element.style.setProperty('--keyboard-inset', `${inset}px`);
  };

  useEffect(syncKeyboardInset);
  useEventListener(viewport, 'resize', syncKeyboardInset);
  useEventListener(viewport, 'scroll', syncKeyboardInset);

  useLockBodyScroll({
    enabled: true,
  });

  useOnRouteChange(onClose);

  useEffect(() => {
    if (isDesktop) {
      onClose();
    }
  }, [
    isDesktop,
    onClose,
  ]);

  useDocumentEventListener('keydown', (event) => {
    if (event.key === KEY_MAP.escape) {
      onClose();
    }
  });

  return (
    <Box
      {...restProps}
      className={[
        styles.MobileDialog,
        className,
      ]}
      ref={[
        ref,
        dialogElement,
      ]}
      role="dialog"
    >
      <Box className={styles.Inner}>{children}</Box>
    </Box>
  );
}
