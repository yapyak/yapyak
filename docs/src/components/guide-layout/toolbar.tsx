import type { GuideAdjacent } from '#lib/guide';
import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChevronIcon } from '#components/chevron-icon';
import { OutlineIcon } from '#components/outline-icon';

import { useGuideLayout } from '../guide-layout';
import styles from './toolbar.module.css';

export interface GuideLayoutToolbarProps {
  children: ReactNode;
  next: GuideAdjacent | null;
  previous: GuideAdjacent | null;
}

export function GuideLayoutToolbar(props: GuideLayoutToolbarProps) {
  const { children, next, previous } = props;
  const { closeSidebar, isSidebarOpen, openSidebar } = useGuideLayout();
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
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [isSidebarOpen]);

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
      className={styles.GuideLayoutToolbar}
      data-hidden={isHidden}
      data-open={isSidebarOpen}
    >
      <Box className={styles.NavContent}>
        <Box className={styles.NavScroll}>{children}</Box>
      </Box>
      <Box className={styles.ButtonRow}>
        {previous ? (
          <Box
            aria-label={t('Previous')}
            as={Link}
            className={styles.NavButton}
            to={previous.href}
          >
            <ChevronIcon direction="left" />
          </Box>
        ) : (
          <Box
            aria-hidden="true"
            className={styles.NavButton}
            data-disabled
          />
        )}
        <Box
          aria-expanded={isSidebarOpen}
          aria-label={
            isSidebarOpen ? t('Close outline') : t('Open outline')
          }
          as="button"
          className={styles.OutlineButton}
          onClick={handleOutlineToggle}
          type="button"
        >
          <OutlineIcon />
        </Box>
        {next ? (
          <Box
            aria-label={t('Next')}
            as={Link}
            className={styles.NavButton}
            to={next.href}
          >
            <ChevronIcon direction="right" />
          </Box>
        ) : (
          <Box
            aria-hidden="true"
            className={styles.NavButton}
            data-disabled
          />
        )}
      </Box>
    </Box>
  );
}
