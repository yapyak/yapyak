import type { BoxProps } from '#components/box';

import { t } from 'yapyak';

import { Box } from '#components/box';
import { Wordmark } from '#components/wordmark';
import { assetUrl } from '#utils/asset';

import styles from './colophon.module.css';

export type ColophonProps = BoxProps<'footer'>;

export function Colophon(props: ColophonProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="footer"
      className={[
        styles.Colophon,
        className,
      ]}
    >
      <Box className={styles.Inner}>
        <Box
          alt=""
          aria-hidden="true"
          as="img"
          className={styles.BubbleImage}
          src={assetUrl('logo.svg')}
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
    </Box>
  );
}
