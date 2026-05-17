import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content.module.css';

export interface ReferenceLayoutContentProps extends BoxProps<'main'> {}

export function ReferenceLayoutContent(props: ReferenceLayoutContentProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="main"
      className={[styles.ReferenceLayoutContent, className]}
    />
  );
}
