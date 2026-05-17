import type { BoxProps } from '#components/box';

import { useEffect, useState } from 'react';

import { Box } from '#components/box';
import { Wordmark } from '#components/wordmark';

import styles from './footer.module.css';

export interface FooterProps extends BoxProps {}

const TAGLINES = [
  "Who's yakking in the back? That's yapyak.",
  "Who's keeping i18n on track? That's yapyak.",
  "Who's that yak inside your stack? That's yapyak.",
  "Who's translating while you snack? That's yapyak.",
  "Who's the AI with the i18n knack? That's yapyak.",
  "Who's i18n minus the heart attack? That's yapyak.",
  "Who's got your back like a perfect fallback? That's yapyak.",
];

const ROTATION_INTERVAL = 5200;

export function Footer(props: FooterProps) {
  const { className, ...restProps } = props;
  const [tagline, setTagline] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const startIndex = Math.floor(Math.random() * TAGLINES.length);
    setTagline(TAGLINES[startIndex] ?? null);
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    if (reducedMotionQuery.matches) {
      return;
    }
    let cursor = startIndex;
    const interval = window.setInterval(() => {
      cursor = (cursor + 1) % TAGLINES.length;
      setTagline(TAGLINES[cursor] ?? null);
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Box
      {...restProps}
      className={[styles.Footer, className]}
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
        MIT license
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
