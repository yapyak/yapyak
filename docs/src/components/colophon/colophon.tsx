import type { BoxProps } from '#components/box';

import { $t } from 'yapyak';

import { Box } from '#components/box';
import { Wordmark } from '#components/wordmark';

import styles from './colophon.module.css';

export interface ColophonProps extends BoxProps {}

export function Colophon(props: ColophonProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.Colophon, className]}
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
        {$t("Who's yakking in the back? That's yapyak.")}
      </Box>
      <Wordmark />
      <Box
        as="p"
        className={styles.CopyrightParagraph}
      >
        © 2026 yapyak
        <Box
          as="span"
          className={styles.SeparatorText}
        >
          ·
        </Box>
        {$t('MIT license')}
        <Box
          as="span"
          className={styles.SeparatorText}
        >
          ·
        </Box>
        <Box
          as="a"
          className={styles.Link}
          href="https://github.com/yapyak/yapyak"
        >
          GitHub
        </Box>
        <Box
          as="span"
          className={styles.SeparatorText}
        >
          ·
        </Box>
        <Box
          as="a"
          className={styles.Link}
          href="https://www.npmjs.com/package/yapyak"
        >
          npm
        </Box>
      </Box>
    </Box>
  );
}
