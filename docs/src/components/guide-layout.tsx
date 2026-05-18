import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState } from 'react';

import { Box } from '#components/box';

import { GuideLayoutContent } from './guide-layout/content';
import { GuideLayoutSidebar } from './guide-layout/sidebar';
import { GuideLayoutSidebarCloseButton } from './guide-layout/sidebar-close-button';
import { GuideLayoutToolbar } from './guide-layout/toolbar';
import styles from './guide-layout.module.css';

export interface GuideLayoutProps extends BoxProps {}

interface GuideLayoutContextValue {
  openSidebar: () => void;
}

const GuideLayoutContext = createContext<GuideLayoutContextValue>({
  openSidebar: () => {},
});

export function useGuideLayout() {
  return useContext(GuideLayoutContext);
}

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
    <GuideLayoutContext value={{ openSidebar: () => setIsSidebarOpen(true) }}>
      <Box
        {...restProps}
        className={[styles.GuideLayout, className]}
        data-sidebar-open={isSidebarOpen}
      >
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
    </GuideLayoutContext>
  );
}

GuideLayout.Sidebar = GuideLayoutSidebar;
GuideLayout.Content = GuideLayoutContent;
GuideLayout.Toolbar = GuideLayoutToolbar;
