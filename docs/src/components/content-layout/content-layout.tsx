import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState } from 'react';

import { Box } from '#components/box';

import styles from './content-layout.module.css';
import { ContentLayoutContent } from './content-layout-content';
import { ContentLayoutOutline } from './content-layout-outline';
import { ContentLayoutSidebar } from './content-layout-sidebar';
import { ContentLayoutToolbar } from './content-layout-toolbar';

export interface ContentLayoutProps extends BoxProps {}

type ContentLayoutContextValue = {
  closeSidebar: () => void;
  openSidebar: () => void;
  sidebarOpen: boolean;
};

const ContentLayoutContext = createContext<ContentLayoutContextValue>({
  closeSidebar: () => {},
  openSidebar: () => {},
  sidebarOpen: false,
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
  }, [
    location.pathname,
  ]);

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
  }, [
    isSidebarOpen,
  ]);

  return (
    <ContentLayoutContext
      value={{
        closeSidebar: () => setIsSidebarOpen(false),
        openSidebar: () => setIsSidebarOpen(true),
        sidebarOpen: isSidebarOpen,
      }}
    >
      <Box
        {...restProps}
        className={[
          styles.ContentLayout,
          className,
        ]}
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
ContentLayout.Outline = ContentLayoutOutline;
ContentLayout.Toolbar = ContentLayoutToolbar;
