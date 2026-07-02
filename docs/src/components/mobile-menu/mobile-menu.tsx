import type { BoxProps } from '#primitives/box';

import { t } from 'yapyak';

import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';
import { OptionMenu } from '#components/option-menu';
import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';
import { Animate } from '#systems/animate';

import styles from './mobile-menu.module.css';

export type MobileMenuProps = BoxProps & {
  open: boolean;
};

export function MobileMenu(props: MobileMenuProps) {
  const { className, open, ...restProps } = props;

  return (
    <Animate in={open}>
      {(animateProps) => (
        <Box
          {...restProps}
          {...animateProps}
          className={[
            styles.MobileMenu,
            className,
          ]}
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
      )}
    </Animate>
  );
}
