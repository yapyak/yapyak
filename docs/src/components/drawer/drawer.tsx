import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './drawer.module.css';

export type DrawerDirection = 'end' | 'start';

export type DrawerProps = BoxProps<'aside'> & {
  direction: DrawerDirection;
  open: boolean;
};

export function Drawer(props: DrawerProps) {
  const { className, direction, open, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="aside"
      className={[
        styles.Drawer,
        className,
      ]}
      data-direction={direction}
      data-open={open ? '' : undefined}
    />
  );
}
