import type { BoxProps } from '#primitives/box';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';
import { OptionMenu } from '#components/option-menu';
import { Sheet } from '#components/sheet';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  useEffect(() => {
    setIsMenuOpen(false);
  }, [
    location,
  ]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = () => {
      if (mediaQuery.matches) {
        setIsMenuOpen(false);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [
    isMenuOpen,
  ]);

  const handleMenuToggle = () => {
    setIsMenuOpen((isOpen) => !isOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <Box
      {...restProps}
      as="header"
      className={[
        styles.LayoutHeader,
        className,
      ]}
      data-fade-border={fadeBorder}
    >
      <Box className={styles.Bar}>
        {children}
        <Box className={styles.MenuButtonSlot}>
          <LayoutHeaderMenuButton
            onToggle={handleMenuToggle}
            open={isMenuOpen}
          />
        </Box>
      </Box>
      <Sheet
        onClose={handleMenuClose}
        open={isMenuOpen}
      >
        <Box className={styles.Menu}>
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
      </Sheet>
    </Box>
  );
}

LayoutHeader.Start = LayoutHeaderStart;
LayoutHeader.Center = LayoutHeaderCenter;
LayoutHeader.End = LayoutHeaderEnd;
