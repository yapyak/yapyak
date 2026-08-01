import type { BoxProps } from '#primitives/box';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import styles from './mobile-navigation.module.css';

export type MobileNavigationProps = BoxProps<'nav'>;

export function MobileNavigation(props: MobileNavigationProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      aria-label={t('Menu')}
      as="nav"
      className={[
        styles.MobileNavigation,
        className,
      ]}
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
  );
}
