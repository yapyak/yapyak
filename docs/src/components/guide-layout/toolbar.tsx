import type { GuideAdjacent } from '#lib/guide';

import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChevronIcon } from '#components/chevron-icon';
import { SectionsIcon } from '#components/sections-icon';

import { useGuideLayout } from '../guide-layout';
import styles from './toolbar.module.css';

export interface GuideLayoutToolbarProps {
  next: GuideAdjacent | null;
  previous: GuideAdjacent | null;
}

export function GuideLayoutToolbar(props: GuideLayoutToolbarProps) {
  const { next, previous } = props;
  const { openSidebar } = useGuideLayout();
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
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
  }, []);

  return (
    <Box
      className={styles.GuideLayoutToolbar}
      data-hidden={isHidden}
    >
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
        aria-label={t('Open sections')}
        as="button"
        className={styles.SectionsButton}
        onClick={openSidebar}
        type="button"
      >
        <SectionsIcon />
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
  );
}
