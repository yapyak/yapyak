import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Box } from '#components/box';

import { GuideLayoutContent } from './guide-layout/content';
import { GuideLayoutSidebar } from './guide-layout/sidebar';
import { GuideLayoutSidebarCloseButton } from './guide-layout/sidebar-close-button';
import { GuideLayoutSidebarToggleButton } from './guide-layout/sidebar-toggle-button';
import styles from './guide-layout.module.css';

export interface GuideLayoutProps extends BoxProps {}

export function GuideLayout(props: GuideLayoutProps) {
  const { children, className, ...restProps } = props;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'clip';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <Box
      {...restProps}
      className={[styles.GuideLayout, className]}
      data-sidebar-open={isSidebarOpen}
    >
      <Box className={styles.SidebarToggleBar}>
        <GuideLayoutSidebarToggleButton
          onClick={() => setIsSidebarOpen(true)}
        />
      </Box>
      <Box
        aria-hidden="true"
        className={styles.Backdrop}
        onClick={() => setIsSidebarOpen(false)}
      />
      <Box className={styles.CloseButtonSlot}>
        <GuideLayoutSidebarCloseButton
          onClick={() => setIsSidebarOpen(false)}
        />
      </Box>
      {children}
    </Box>
  );
}

GuideLayout.Sidebar = GuideLayoutSidebar;
GuideLayout.Content = GuideLayoutContent;
