import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './layout-header-start.module.css';

export type LayoutHeaderStartProps = BoxProps;

export function LayoutHeaderStart(props: LayoutHeaderStartProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.LayoutHeaderStart,
        className,
      ]}
    />
  );
}
