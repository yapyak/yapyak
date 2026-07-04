import type { BoxProps } from '#primitives/box';
import type { AnimateChildProps } from '#systems/animate';

import { Backdrop } from '#components/backdrop';
import { Overlay } from '#components/overlay';
import { Box } from '#primitives/box';

import styles from './dialog.module.css';

export type DialogProps = BoxProps &
  Partial<AnimateChildProps> & {
    onClose?: () => void;
  };

export function Dialog(props: DialogProps) {
  const {
    children,
    className,
    'data-animate': dataAnimate,
    inert,
    onClose,
    ref,
    ...restProps
  } = props;

  const animateProps = {
    'data-animate': dataAnimate,
    inert,
    ref,
  };

  return (
    <Overlay
      closeOnEscape={true}
      onClose={onClose}
    >
      <Backdrop
        {...animateProps}
        onClick={onClose}
        opaque={true}
      />
      <Box
        {...restProps}
        {...animateProps}
        aria-modal={true}
        className={[
          styles.Dialog,
          className,
        ]}
        role="dialog"
      >
        {children}
      </Box>
    </Overlay>
  );
}
