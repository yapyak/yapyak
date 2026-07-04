import type { BoxProps } from '#primitives/box';

import { t } from 'yapyak';

import { Icon } from '#components/icon';
import { IconLink } from '#components/icon-link';
import { OptionMenu } from '#components/option-menu';
import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';
import { Animate } from '#systems/animate';

import styles from './mobile-dialog.module.css';

export type MobileDialogProps = BoxProps & {
  open: boolean;
};

export function MobileDialog(props: MobileDialogProps) {
  const { className, open, ...restProps } = props;

  return (
    <Animate in={open}>
      {(animateProps) => (
        <Box
          {...restProps}
          {...animateProps}
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
              <OptionMenu group="framework" />
              <OptionMenu group="packageManager" />
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
      )}
    </Animate>
  );
}
