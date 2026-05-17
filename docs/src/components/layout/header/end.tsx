import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './end.module.css';

export interface HeaderEndProps extends BoxProps {}

export function HeaderEnd(props: HeaderEndProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.HeaderEnd, className]}
    />
  );
}
