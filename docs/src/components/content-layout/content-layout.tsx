import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState } from 'react';

import { Box } from '#components/box';

import styles from './content-layout.module.css';
import { ContentLayoutContent } from './content-layout-content';
import { ContentLayoutContentContent } from './content-layout-content-content';
import { ContentLayoutContentHeader } from './content-layout-content-header';
import { ContentLayoutOutline } from './content-layout-outline';
import { ContentLayoutSidebar } from './content-layout-sidebar';

export type ContentLayoutProps = BoxProps;

type ContentLayoutContextValue = {
  closeOutline: () => void;
  closeSidebar: () => void;
  openOutline: () => void;
  openSidebar: () => void;
  outlineOpen: boolean;
  resizing: boolean;
  sidebarOpen: boolean;
};

const ContentLayoutContext = createContext<ContentLayoutContextValue>({
  closeOutline: () => {},
  closeSidebar: () => {},
  openOutline: () => {},
  openSidebar: () => {},
  outlineOpen: false,
  resizing: false,
  sidebarOpen: false,
});

const RESIZE_SETTLE_MS = 150;

export function useContentLayout() {
  return useContext(ContentLayoutContext);
}

export function ContentLayout(props: ContentLayoutProps) {
  const { children, className, ...restProps } = props;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const location = useLocation();

  const isAnyDrawerOpen = isSidebarOpen || isOutlineOpen;

  // biome-ignore lint/correctness/useExhaustiveDependencies: closes drawers on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsOutlineOpen(false);
  }, [
    location.pathname,
    location.hash,
  ]);

  useEffect(() => {
    if (!isAnyDrawerOpen) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsOutlineOpen(false);
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
    isAnyDrawerOpen,
  ]);

  useEffect(() => {
    const sidebarMedia = window.matchMedia('(min-width: 1024px)');
    const handleSidebar = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsSidebarOpen(false);
      }
    };
    sidebarMedia.addEventListener('change', handleSidebar);
    return () => sidebarMedia.removeEventListener('change', handleSidebar);
  }, []);

  useEffect(() => {
    const outlineMedia = window.matchMedia('(min-width: 1324px)');
    const handleOutline = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsOutlineOpen(false);
      }
    };
    outlineMedia.addEventListener('change', handleOutline);
    return () => outlineMedia.removeEventListener('change', handleOutline);
  }, []);

  useEffect(() => {
    let timeoutId: number | undefined;
    const handleResize = () => {
      setIsResizing(true);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setIsResizing(false);
      }, RESIZE_SETTLE_MS);
    };
    window.addEventListener('resize', handleResize, {
      passive: true,
    });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const closeAll = () => {
    setIsSidebarOpen(false);
    setIsOutlineOpen(false);
  };

  return (
    <ContentLayoutContext
      value={{
        closeOutline: () => setIsOutlineOpen(false),
        closeSidebar: () => setIsSidebarOpen(false),
        openOutline: () => setIsOutlineOpen(true),
        openSidebar: () => setIsSidebarOpen(true),
        outlineOpen: isOutlineOpen,
        resizing: isResizing,
        sidebarOpen: isSidebarOpen,
      }}
    >
      <Box
        {...restProps}
        className={[
          styles.ContentLayout,
          className,
        ]}
        data-drawer-open={isAnyDrawerOpen ? '' : undefined}
      >
        <Box
          aria-hidden="true"
          className={styles.Backdrop}
          onClick={closeAll}
        />
        {children}
      </Box>
    </ContentLayoutContext>
  );
}

ContentLayout.Sidebar = ContentLayoutSidebar;
ContentLayout.Content = ContentLayoutContent;
ContentLayout.ContentHeader = ContentLayoutContentHeader;
ContentLayout.ContentContent = ContentLayoutContentContent;
ContentLayout.Outline = ContentLayoutOutline;
