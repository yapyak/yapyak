import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './layout-header.module.css';
import { LayoutHeaderCenter } from './layout-header-center';
import { LayoutHeaderEnd } from './layout-header-end';
import { LayoutHeaderStart } from './layout-header-start';

export type LayoutHeaderProps = BoxProps<'header'> & {
  fadeBorder?: boolean;
};

export function LayoutHeader(props: LayoutHeaderProps) {
  const { children, className, fadeBorder, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="header"
      className={[
        styles.LayoutHeader,
        className,
      ]}
      data-fade-border={fadeBorder}
    >
      <Box className={styles.Bar}>{children}</Box>
    </Box>
  );
}

LayoutHeader.Start = LayoutHeaderStart;
LayoutHeader.Center = LayoutHeaderCenter;
LayoutHeader.End = LayoutHeaderEnd;
