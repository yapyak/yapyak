import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './end.module.css';

export interface LayoutHeaderEndProps extends BoxProps {}

export function LayoutHeaderEnd(props: LayoutHeaderEndProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.LayoutHeaderEnd, className]}
    />
  );
}
