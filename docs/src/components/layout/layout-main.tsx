import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './layout-main.module.css';

export type LayoutMainProps = BoxProps<'main'>;

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
