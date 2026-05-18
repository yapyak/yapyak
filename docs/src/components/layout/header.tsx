import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';

import { HeaderCenter } from './header/center';
import { HeaderEnd } from './header/end';
import { HeaderMenuButton } from './header/menu-button';
import { HeaderStart } from './header/start';
import styles from './header.module.css';

export interface LayoutHeaderProps extends BoxProps<'header'> {}

export function LayoutHeader(props: LayoutHeaderProps) {
  const { children, className, ...restProps } = props;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsScrolled(window.scrollY > 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'clip';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Box
      {...restProps}
      as="header"
      className={[styles.LayoutHeader, className]}
      data-menu-open={isMenuOpen}
      data-scrolled={isScrolled}
    >
      <Box className={styles.Bar}>
        {children}
        <Box className={styles.MenuButtonSlot}>
          <HeaderMenuButton
            isOpen={isMenuOpen}
            onToggle={() => setIsMenuOpen((open) => !open)}
          />
        </Box>
      </Box>
      <Box
        as="nav"
        className={styles.Drawer}
      >
        <Box className={styles.LinkStack}>
          <Link
            className={styles.Link}
            onClick={closeMenu}
            to="/"
          >
            {t('Home')}
          </Link>
          <Link
            className={styles.Link}
            onClick={closeMenu}
            to="/guide"
          >
            {t('Guide')}
          </Link>
          <Link
            className={styles.Link}
            onClick={closeMenu}
            to="/reference"
          >
            {t('Reference')}
          </Link>
        </Box>
        <Box className={styles.GithubSlot}>
          <IconLink
            aria-label={t('View on GitHub')}
            href="https://github.com/yapyak/yapyak"
            onClick={closeMenu}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon />
          </IconLink>
        </Box>
      </Box>
    </Box>
  );
}

LayoutHeader.Start = HeaderStart;
LayoutHeader.Center = HeaderCenter;
LayoutHeader.End = HeaderEnd;
