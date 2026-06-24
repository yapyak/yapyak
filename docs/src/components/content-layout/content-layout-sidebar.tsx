import type { DrawerProps } from '#components/drawer';

import { Drawer } from '#components/drawer';

import { useContentLayout } from './content-layout';
import styles from './content-layout-sidebar.module.css';

export type ContentLayoutSidebarProps = Omit<DrawerProps, 'direction' | 'open'>;

export function ContentLayoutSidebar(props: ContentLayoutSidebarProps) {
  const { className, ...restProps } = props;

  const { resizing, sidebarOpen } = useContentLayout();

  return (
    <Drawer
      {...restProps}
      className={[
        styles.ContentLayoutSidebar,
        className,
      ]}
      data-no-transition={resizing ? '' : undefined}
      direction="start"
      id="sidebar"
      open={sidebarOpen}
    />
  );
}
