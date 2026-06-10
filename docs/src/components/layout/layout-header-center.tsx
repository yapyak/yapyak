import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './layout-header-center.module.css';

export interface LayoutHeaderCenterProps extends BoxProps {}

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
