import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState } from 'react';

import { Box } from '#components/box';

import { ContentLayoutContent } from './content-layout/content';
import { ContentLayoutSidebar } from './content-layout/sidebar';
import { ContentLayoutToolbar } from './content-layout/toolbar';
import styles from './content-layout.module.css';

export interface ContentLayoutProps extends BoxProps {}

interface ContentLayoutContextValue {
  closeSidebar: () => void;
  isSidebarOpen: boolean;
  openSidebar: () => void;
}

const ContentLayoutContext = createContext<ContentLayoutContextValue>({
  closeSidebar: () => {},
  isSidebarOpen: false,
  openSidebar: () => {},
});

export function useContentLayout() {
  return useContext(ContentLayoutContext);
}

export function ContentLayout(props: ContentLayoutProps) {
  const { children, className, ...restProps } = props;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
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
    <ContentLayoutContext
      value={{
        closeSidebar: () => setIsSidebarOpen(false),
        isSidebarOpen,
        openSidebar: () => setIsSidebarOpen(true),
      }}
    >
      <Box
        {...restProps}
        className={[styles.ContentLayout, className]}
        data-sidebar-open={isSidebarOpen}
      >
        <Box
          aria-hidden="true"
          className={styles.Backdrop}
          onClick={() => setIsSidebarOpen(false)}
        />
        {children}
      </Box>
    </ContentLayoutContext>
  );
}

ContentLayout.Sidebar = ContentLayoutSidebar;
ContentLayout.Content = ContentLayoutContent;
ContentLayout.Toolbar = ContentLayoutToolbar;
