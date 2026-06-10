import type { BoxProps } from '#components/box';

import { t } from 'yapyak';

import { Box } from '#components/box';
import { Wordmark } from '#components/wordmark';

import styles from './colophon.module.css';

export interface ColophonProps extends BoxProps {}

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
        alt=""
        aria-hidden="true"
        as="img"
        className={styles.BubbleImage}
        src="/logo.svg"
      />
      <Box
        as="p"
        className={styles.TaglineParagraph}
      >
        {t("Who's yakking in the back? That's yapyak.")}
      </Box>
      <Wordmark />
      <Box
        as="p"
        className={styles.LicenseParagraph}
      >
        {t('MIT-licensed')}
      </Box>
    </Box>
  );
}
