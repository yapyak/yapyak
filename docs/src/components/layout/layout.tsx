import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './layout.module.css';
import { LayoutFooter } from './layout-footer';
import { LayoutHeader } from './layout-header';
import { LayoutMain } from './layout-main';

export interface LayoutProps extends BoxProps {}

export function Layout(props: LayoutProps) {
  const { children, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.Layout,
        className,
      ]}
    >
      <Box
        aria-hidden="true"
        className={styles.GrainOverlay}
      />
      {children}
    </Box>
  );
}

Layout.Header = LayoutHeader;
Layout.Main = LayoutMain;
Layout.Footer = LayoutFooter;
