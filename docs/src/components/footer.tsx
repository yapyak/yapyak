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
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const start = Math.floor(Math.random() * TAGLINES.length);
    setIndex(start);
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    if (reducedMotionQuery.matches) {
      return;
    }
    const interval = window.setInterval(() => {
      setIndex((previous) =>
        previous === null ? start : (previous + 1) % TAGLINES.length,
      );
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
        className={styles.Bubble}
        src="/logo.svg"
      />
      <Box className={styles.TaglineSlot}>
        {index !== null && (
          <Box
            as="p"
            className={styles.Tagline}
            key={index}
          >
            {TAGLINES[index]}
          </Box>
        )}
      </Box>
      <Wordmark />
      <Box
        as="p"
        className={styles.Copyright}
      >
        © 2026 yapyak
        <Box
          as="span"
          className={styles.Separator}
        >
          ·
        </Box>
        MIT license
        <Box
          as="span"
          className={styles.Separator}
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
          className={styles.Separator}
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
