import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './start.module.css';

export interface LayoutHeaderStartProps extends BoxProps {}

export function LayoutHeaderStart(props: LayoutHeaderStartProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.LayoutHeaderStart, className]}
    />
  );
}
