import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './layout-header-center.module.css';

export type LayoutHeaderCenterProps = BoxProps;

export function LayoutHeaderCenter(props: LayoutHeaderCenterProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.LayoutHeaderCenter,
        className,
      ]}
    />
  );
}
