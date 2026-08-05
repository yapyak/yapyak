import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

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
