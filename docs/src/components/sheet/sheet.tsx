import type { BoxProps } from '#primitives/box';

import { Backdrop } from '#components/backdrop';
import { Overlay } from '#components/overlay';
import { Box } from '#primitives/box';
import { Animate } from '#systems/animate';

import styles from './sheet.module.css';

export type SheetProps = BoxProps & {
  open: boolean;
  onClose?: () => void;
};

export function Sheet(props: SheetProps) {
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
              styles.Sheet,
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
