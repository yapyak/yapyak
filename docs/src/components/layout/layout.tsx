import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './layout.module.css';
import { LayoutFooter } from './layout-footer';
import { LayoutHeader } from './layout-header';
import { LayoutMain } from './layout-main';

export type LayoutProps = BoxProps;

export function Layout(props: LayoutProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.Layout,
        className,
      ]}
    />
  );
}

Layout.Header = LayoutHeader;
Layout.Main = LayoutMain;
Layout.Footer = LayoutFooter;
