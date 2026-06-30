import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';

import { Backdrop } from '#components/backdrop';
import { Box } from '#components/box';
import { Overlay } from '#components/overlay';
import { Animate } from '#systems/animate';

import styles from './drawer.module.css';

export type DrawerDirection = 'end' | 'start';

export type DrawerProps = BoxProps<'aside'> & {
  direction: DrawerDirection;
  open: boolean;
  onClose?: () => void;
};

export function Drawer(props: DrawerProps): ReactElement {
  const { children, className, direction, onClose, open, ...restProps } = props;

  return (
    <Animate in={open}>
      {(animateProps) => (
        <Overlay
          closeOnEscape={true}
          onClose={onClose}
        >
          <Backdrop
            data-animate={animateProps['data-animate']}
            onClick={onClose}
            opaque={true}
          />
          <Box
            {...restProps}
            {...animateProps}
            as="aside"
            className={[
              styles.Drawer,
              className,
            ]}
            data-direction={direction}
          >
            {children}
          </Box>
        </Overlay>
      )}
    </Animate>
  );
}
