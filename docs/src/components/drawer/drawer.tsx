import type { BoxProps } from '#primitives/box';

import { Backdrop } from '#components/backdrop';
import { Overlay } from '#components/overlay';
import { Box } from '#primitives/box';
import { Animate } from '#systems/animate';

import styles from './drawer.module.css';

export type DrawerDirection = 'end' | 'start';

export type DrawerProps = BoxProps & {
  direction: DrawerDirection;
  open: boolean;
  onClose?: () => void;
};

export function Drawer(props: DrawerProps) {
  const { children, className, direction, onClose, open, ...restProps } = props;

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
              styles.Drawer,
              className,
            ]}
            data-direction={direction}
            role="dialog"
          >
            {children}
          </Box>
        </Overlay>
      )}
    </Animate>
  );
}
