import type { BoxProps } from '#primitives/box';

import { useEffect } from 'react';
import { t } from 'yapyak';

import { Icon } from '#components/icon';
import { IconLink } from '#components/icon-link';
import { OptionMenuTrigger } from '#components/option-menu-trigger';
import { KEY_MAP } from '#constants';
import { useDocumentEventListener } from '#hooks/use-document-event-listener';
import { useLockBodyScroll } from '#hooks/use-lock-body-scroll';
import { useMediaQuery } from '#hooks/use-media-query';
import { useOnRouteChange } from '#hooks/use-on-route-change';
import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import styles from './mobile-dialog.module.css';

export type MobileDialogProps = BoxProps & {
  onClose: () => void;
};

export function MobileDialog(props: MobileDialogProps) {
  const { className, onClose, ...restProps } = props;
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useLockBodyScroll({
    enabled: true,
  });

  useOnRouteChange(onClose);

  useEffect(() => {
    if (isDesktop) {
      onClose();
    }
  }, [
    isDesktop,
    onClose,
  ]);

  useDocumentEventListener('keydown', (event) => {
    if (event.key === KEY_MAP.escape) {
      onClose();
    }
  });

  return (
    <Box
      {...restProps}
      aria-label={t('Menu')}
      className={[
        styles.MobileDialog,
        className,
      ]}
      role="dialog"
    >
      <Box className={styles.Inner}>
        <Box className={styles.Scroll}>
          <Box
            aria-label={t('Menu')}
            as="nav"
            className={styles.LinkStack}
          >
            <LinkBase
              className={styles.Link}
              to="/"
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
        </Box>
        <Box
          as="footer"
          className={styles.Footer}
        >
          <OptionMenuTrigger group="framework" />
          <OptionMenuTrigger group="packageManager" />
          <IconLink
            aria-label={t('View on GitHub')}
            href="https://github.com/yapyak/yapyak"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon name="github" />
          </IconLink>
        </Box>
      </Box>
    </Box>
  );
}
