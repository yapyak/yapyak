import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { Drawer } from '#components/drawer';
import { useMediaQuery } from '#hooks/use-media-query';

import { useContentLayout } from './content-layout';
import styles from './content-layout-sidebar.module.css';

export type ContentLayoutSidebarProps = BoxProps;

export function ContentLayoutSidebar(
  props: ContentLayoutSidebarProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  const { closeSidebar, sidebarOpen } = useContentLayout();
  const isWide = useMediaQuery('(min-width: 1024px)');

  if (isWide) {
    return (
      <Box
        {...restProps}
        as="aside"
        className={[
          styles.ContentLayoutSidebar,
          className,
        ]}
        id="sidebar"
      >
        {children}
      </Box>
    );
  }

  return (
    <Drawer
      {...restProps}
      className={[
        styles.ContentLayoutSidebar,
        className,
      ]}
      direction="start"
      id="sidebar"
      onClose={closeSidebar}
      open={sidebarOpen}
    >
      {children}
    </Drawer>
  );
}
