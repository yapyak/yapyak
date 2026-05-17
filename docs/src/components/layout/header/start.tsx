import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './start.module.css';

export interface HeaderStartProps extends BoxProps {}

export function HeaderStart(props: HeaderStartProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.HeaderStart, className]}
    />
  );
}
