import type { BoxProps } from '#primitives/box';

import { useEffect } from 'react';

import { KEY_MAP } from '#constants';
import { useDocumentEventListener } from '#hooks/use-document-event-listener';
import { useLockBodyScroll } from '#hooks/use-lock-body-scroll';
import { useMediaQuery } from '#hooks/use-media-query';
import { useOnRouteChange } from '#hooks/use-on-route-change';
import { Box } from '#primitives/box';

import styles from './mobile-dialog.module.css';

export type MobileDialogProps = BoxProps & {
  onClose: () => void;
};

export function MobileDialog(props: MobileDialogProps) {
  const { children, className, onClose, ...restProps } = props;
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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
      role="dialog"
    >
      <Box className={styles.Inner}>{children}</Box>
    </Box>
  );
}
