import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './layout-main.module.css';

export interface LayoutMainProps extends BoxProps<'main'> {}

export function LayoutMain(props: LayoutMainProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="main"
      className={[
        styles.LayoutMain,
        className,
      ]}
    />
  );
}
