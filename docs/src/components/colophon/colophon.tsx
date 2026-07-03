import type { BoxProps } from '#primitives/box';

import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

import { Box } from '#primitives/box';

import styles from './colophon.module.css';

export type ColophonProps = BoxProps;

export function Colophon(props: ColophonProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.Colophon,
        className,
      ]}
    >
      <Box
        aria-hidden="true"
        as="svg"
        className={styles.BubbleImage}
        viewBox="0 0 24 24"
      >
        <path
          className={styles.BrandFill}
          d="M12,0 C18.627375,0 24,5.372625 24,12 C24,18.627375 18.627375,24 12,24 L3,24 C1.34325,24 0,22.65675 0,21 L0,12 C0,5.372625 5.372625,0 12,0 Z M6,10.125 C4.96446609,10.125 4.125,10.9644661 4.125,12 C4.125,13.0355339 4.96446609,13.875 6,13.875 C7.03553391,13.875 7.875,13.0355339 7.875,12 C7.875,10.9644661 7.03553391,10.125 6,10.125 Z M12,10.125 C10.9644661,10.125 10.125,10.9644661 10.125,12 C10.125,13.0355339 10.9644661,13.875 12,13.875 C13.0355339,13.875 13.875,13.0355339 13.875,12 C13.875,10.9644661 13.0355339,10.125 12,10.125 Z M18,10.125 C16.9644661,10.125 16.125,10.9644661 16.125,12 C16.125,13.0355339 16.9644661,13.875 18,13.875 C19.0355339,13.875 19.875,13.0355339 19.875,12 C19.875,10.9644661 19.0355339,10.125 18,10.125 Z"
        />
      </Box>
      <Box
        as="p"
        className={styles.TaglineParagraph}
      >
        {t("Who's yakking in the back?​ That's yapyak.")}
      </Box>
      <Box
        as="p"
        className={styles.LicenseParagraph}
      >
        <RichText
          builtByLink={(children) => (
            <Box
              as="a"
              href="https://github.com/qwuide"
              rel="noopener noreferrer"
              target="_blank"
            >
              {children}
            </Box>
          )}
          licenceLink={(children) => (
            <Box
              as="a"
              href="https://github.com/yapyak/yapyak/blob/main/LICENSE"
              rel="noopener noreferrer"
              target="_blank"
            >
              {children}
            </Box>
          )}
          value={t(
            '<licenceLink>MIT-licensed</licenceLink>. Built by <builtByLink>Joakim Uhrwing</builtByLink>.',
          )}
        />
      </Box>
    </Box>
  );
}
