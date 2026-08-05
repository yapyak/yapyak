import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './layout-header-end.module.css';

export type LayoutHeaderEndProps = BoxProps;

export function LayoutHeaderEnd(props: LayoutHeaderEndProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.LayoutHeaderEnd,
        className,
      ]}
    />
  );
}
