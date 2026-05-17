import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './center.module.css';

export interface HeaderCenterProps extends BoxProps {}

export function HeaderCenter(props: HeaderCenterProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.HeaderCenter, className]}
    />
  );
}
