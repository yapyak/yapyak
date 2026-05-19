import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content.module.css';

export interface ContentLayoutContentProps extends BoxProps<'main'> {}

export function ContentLayoutContent(props: ContentLayoutContentProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="main"
      className={[styles.ContentLayoutContent, className]}
    />
  );
}
