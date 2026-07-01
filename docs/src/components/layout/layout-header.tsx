import type { BoxProps } from '#primitives/box';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';
import { OptionMenu } from '#components/option-menu';
import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import styles from './layout-header.module.css';
import { LayoutHeaderCenter } from './layout-header-center';
import { LayoutHeaderEnd } from './layout-header-end';
import { LayoutHeaderMenuButton } from './layout-header-menu-button';
import { LayoutHeaderStart } from './layout-header-start';

export type LayoutHeaderProps = BoxProps<'header'> & {
  fadeBorder?: boolean;
};

export function LayoutHeader(props: LayoutHeaderProps) {
  const { children, className, fadeBorder, ...restProps } = props;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    setIsMenuOpen(false);
  }, [
    location,
  ]);

  useEffect(() => {
    const update = () => {
      setIsScrolled(window.scrollY > 0);
    };
    update();
    window.addEventListener('scroll', update, {
      passive: true,
    });
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
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = () => {
      if (mediaQuery.matches) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    mediaQuery.addEventListener('change', handleMediaChange);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'clip';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      mediaQuery.removeEventListener('change', handleMediaChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [
    isMenuOpen,
  ]);

  return (
    <Box
      {...restProps}
      as="header"
      className={[
        styles.LayoutHeader,
        className,
      ]}
      data-fade-border={fadeBorder}
      data-menu-open={isMenuOpen}
      data-scrolled={isScrolled}
    >
      <Box className={styles.Bar}>
        {children}
        <Box className={styles.MenuButtonSlot}>
          <LayoutHeaderMenuButton
            onToggle={() => setIsMenuOpen((open) => !open)}
            open={isMenuOpen}
          />
        </Box>
      </Box>
      <Box
        as="nav"
        className={styles.Drawer}
      >
        <Box className={styles.LinkStack}>
          <LinkBase
            className={styles.Link}
            to="/home"
          >
            {t('Home')}
          </LinkBase>
          <LinkBase
            className={styles.Link}
            to="/guide"
          >
            {t('Guide')}
          </LinkBase>
          <LinkBase
            className={styles.Link}
            to="/reference"
          >
            {t('Reference')}
          </LinkBase>
        </Box>
        <Box
          as="footer"
          className={styles.Footer}
        >
          <OptionMenu group="framework" />
          <OptionMenu group="packageManager" />
          <IconLink
            aria-label={t('View on GitHub')}
            href="https://github.com/yapyak/yapyak"
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

LayoutHeader.Start = LayoutHeaderStart;
LayoutHeader.Center = LayoutHeaderCenter;
LayoutHeader.End = LayoutHeaderEnd;
