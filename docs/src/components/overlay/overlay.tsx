import type { ReactElement } from 'react';
import type { StackProps } from '#systems/stack';

import { useState } from 'react';

import { KEY_MAP } from '#constants';
import { useDocumentEventListener } from '#hooks/use-document-event-listener';
import { useLockBodyScroll } from '#hooks/use-lock-body-scroll';
import { Portal } from '#systems/portal';
import { Stack } from '#systems/stack';

import styles from './overlay.module.css';

export type OverlayProps = StackProps & {
  closeOnEscape?: boolean;
  onClose?: () => void;
};

export function Overlay(props: OverlayProps): ReactElement {
  const {
    className,
    closeOnEscape = false,
    onActiveChange,
    onClose,
    ...restProps
  } = props;

  const [isActive, setIsActive] = useState(false);

  useDocumentEventListener('keydown', (event) => {
    if (closeOnEscape && isActive && event.key === KEY_MAP.escape) {
      onClose?.();
    }
  });

  useLockBodyScroll({
    enabled: isActive,
  });

  const handleActiveChange = (active: boolean) => {
    setIsActive(active);
    onActiveChange?.(active);
  };

  return (
    <Portal>
      <Stack
        {...restProps}
        className={[
          styles.Overlay,
          className,
        ]}
        onActiveChange={handleActiveChange}
      />
    </Portal>
  );
}
