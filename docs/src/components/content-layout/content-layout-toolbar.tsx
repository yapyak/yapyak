import type { Page } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChevronIcon } from '#components/chevron-icon';
import { OutlineIcon } from '#components/outline-icon';

import { useContentLayout } from './content-layout';
import styles from './content-layout-toolbar.module.css';
import { doc } from 'virtual:doc-compiler';

export type ContentLayoutToolbarProps = BoxProps & {
  page?: Page;
};

export function ContentLayoutToolbar(props: ContentLayoutToolbarProps) {
  const { children, className, page, ...restProps } = props;
  const { nextPage, previousPage } = page
    ? doc.findAdjacentPages(page)
    : {
        nextPage: null,
        previousPage: null,
      };
  const {
    closeSidebar,
    openSidebar,
    sidebarOpen: isSidebarOpen,
  } = useContentLayout();
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (isSidebarOpen) {
      return;
    }
    lastScrollYRef.current = window.scrollY;
    const update = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      if (Math.abs(delta) < 8) {
        return;
      }
      if (delta > 0 && currentScrollY > 80) {
        setIsHidden(true);
      } else if (delta < 0) {
        setIsHidden(false);
      }
      lastScrollYRef.current = currentScrollY;
    };
    window.addEventListener('scroll', update, {
      passive: true,
    });
    return () => window.removeEventListener('scroll', update);
  }, [
    isSidebarOpen,
  ]);

  const handleOutlineToggle = () => {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      setIsHidden(false);
      openSidebar();
    }
  };

  return (
    <Box
      {...restProps}
      className={[
        styles.ContentLayoutToolbar,
        className,
      ]}
      data-hidden={isHidden}
      data-open={isSidebarOpen}
    >
      <Box className={styles.NavContent}>
        <Box className={styles.NavScroll}>{children}</Box>
      </Box>
      <Box className={styles.ButtonRow}>
        {previousPage ? (
          <Box
            aria-label={t('Previous')}
            as={Link}
            className={styles.NavButton}
            to={previousPage.href}
          >
            <ChevronIcon direction="left" />
          </Box>
        ) : (
          <Box
            aria-label={t('Previous')}
            as="button"
            className={styles.NavButton}
            disabled={true}
            type="button"
          >
            <ChevronIcon direction="left" />
          </Box>
        )}
        <Box
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? t('Close outline') : t('Open outline')}
          as="button"
          className={styles.OutlineButton}
          onClick={handleOutlineToggle}
          type="button"
        >
          <OutlineIcon />
        </Box>
        {nextPage ? (
          <Box
            aria-label={t('Next')}
            as={Link}
            className={styles.NavButton}
            to={nextPage.href}
          >
            <ChevronIcon direction="right" />
          </Box>
        ) : (
          <Box
            aria-label={t('Next')}
            as="button"
            className={styles.NavButton}
            disabled={true}
            type="button"
          >
            <ChevronIcon direction="right" />
          </Box>
        )}
      </Box>
    </Box>
  );
}
