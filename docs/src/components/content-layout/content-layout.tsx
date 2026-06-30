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
  sidebarOpen: boolean;
};

const ContentLayoutContext = createContext<ContentLayoutContextValue>({
  closeOutline: () => {},
  closeSidebar: () => {},
  openOutline: () => {},
  openSidebar: () => {},
  outlineOpen: false,
  sidebarOpen: false,
});

export function useContentLayout() {
  return useContext(ContentLayoutContext);
}

export function ContentLayout(props: ContentLayoutProps) {
  const { children, className, ...restProps } = props;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsOutlineOpen(false);
  }, [
    location.pathname,
    location.hash,
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

  return (
    <ContentLayoutContext
      value={{
        closeOutline: () => setIsOutlineOpen(false),
        closeSidebar: () => setIsSidebarOpen(false),
        openOutline: () => setIsOutlineOpen(true),
        openSidebar: () => setIsSidebarOpen(true),
        outlineOpen: isOutlineOpen,
        sidebarOpen: isSidebarOpen,
      }}
    >
      <Box
        {...restProps}
        className={[
          styles.ContentLayout,
          className,
        ]}
      >
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
