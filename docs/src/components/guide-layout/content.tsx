import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content.module.css';

export interface GuideLayoutContentProps extends BoxProps<'main'> {}

export function GuideLayoutContent(props: GuideLayoutContentProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="main"
      className={[styles.GuideLayoutContent, className]}
    />
  );
}
