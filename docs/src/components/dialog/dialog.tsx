import type { BoxProps } from '#primitives/box';

import { Backdrop } from '#components/backdrop';
import { Overlay } from '#components/overlay';
import { Box } from '#primitives/box';
import { Animate } from '#systems/animate';

import styles from './dialog.module.css';

export type DialogProps = BoxProps & {
  open: boolean;
  onClose?: () => void;
};

export function Dialog(props: DialogProps) {
  const { children, className, onClose, open, ...restProps } = props;

  return (
    <Animate in={open}>
      {(animateProps) => (
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
      )}
    </Animate>
  );
}
