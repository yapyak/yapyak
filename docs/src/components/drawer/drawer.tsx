import type { BoxProps } from '#primitives/box';
import type { AnimateChildProps } from '#systems/animate';

import { Box } from '#primitives/box';

import { Backdrop } from '../backdrop';
import { Overlay } from '../overlay';
import styles from './drawer.module.css';

export type DrawerDirection = 'end' | 'start';

export type DrawerProps = BoxProps &
  Partial<AnimateChildProps> & {
    direction: DrawerDirection;
    onClose?: () => void;
  };

export function Drawer(props: DrawerProps) {
  const {
    children,
    className,
    'data-animate': dataAnimate,
    direction,
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
          styles.Drawer,
          className,
        ]}
        data-direction={direction}
        role="dialog"
      >
        {children}
      </Box>
    </Overlay>
  );
}
