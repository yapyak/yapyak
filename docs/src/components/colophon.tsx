import type { BoxProps } from '#components/box';

import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { Wordmark } from '#components/wordmark';

import styles from './colophon.module.css';

export interface ColophonProps extends BoxProps {}

const TAGLINE_COUNT = 7;
const ROTATION_INTERVAL = 5200;

export function Colophon(props: ColophonProps) {
  const { className, ...restProps } = props;
  const [taglineIndex, setTaglineIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const startIndex = Math.floor(Math.random() * TAGLINE_COUNT);
    setTaglineIndex(startIndex);
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    if (reducedMotionQuery.matches) {
      return;
    }
    let cursor = startIndex;
    const intervalId = window.setInterval(() => {
      cursor = (cursor + 1) % TAGLINE_COUNT;
      setTaglineIndex(cursor);
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  const taglines: string[] = [
    t("Who's yakking in the back? That's yapyak."),
    t("Who's keeping i18n on track? That's yapyak."),
    t("Who's that yak inside your stack? That's yapyak."),
    t("Who's translating while you snack? That's yapyak."),
    t("Who's the AI with the i18n knack? That's yapyak."),
    t("Who's i18n minus the heart attack? That's yapyak."),
    t("Who's got your back like a perfect fallback? That's yapyak."),
  ];

  const tagline = taglineIndex === null ? null : taglines[taglineIndex];

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
      <Box className={styles.TaglineRow}>
        {tagline && (
          <Box
            as="p"
            className={styles.TaglineParagraph}
            key={tagline}
          >
            {tagline}
          </Box>
        )}
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
        {t('MIT license')}
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
