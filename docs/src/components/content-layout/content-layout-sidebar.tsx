import type { MouseEvent } from 'react';
import type { DrawerProps } from '#components/drawer';

import { useRouter } from '@tanstack/react-router';

import { Drawer } from '#components/drawer';

import { useContentLayout } from './content-layout';
import styles from './content-layout-sidebar.module.css';

export type ContentLayoutSidebarProps = Omit<DrawerProps, 'direction' | 'open'>;

const DRAWER_CLOSE_TRANSITION_MS = 320;

export function ContentLayoutSidebar(props: ContentLayoutSidebarProps) {
  const { className, ...restProps } = props;
  const { closeSidebar, resizing, sidebarOpen } = useContentLayout();
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!sidebarOpen) {
      return;
    }
    if (event.defaultPrevented) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    const link = event.target.closest('a');
    if (link === null) {
      return;
    }
    if (link.target !== '' && link.target !== '_self') {
      return;
    }
    const href = link.getAttribute('href');
    if (href === null || !href.startsWith('/')) {
      return;
    }

    event.preventDefault();
    closeSidebar();
    window.setTimeout(() => {
      router.history.push(href);
    }, DRAWER_CLOSE_TRANSITION_MS);
  };

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
      onClick={handleClick}
      open={sidebarOpen}
    />
  );
}
