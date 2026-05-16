import type { ReactElement } from 'react';

import { useEffect, useState } from 'react';

import { Wordmark } from '#components/wordmark';

import styles from './footer.module.css';

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

export function Footer(): ReactElement {
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
    <div className={styles.Footer}>
      <img
        alt=""
        aria-hidden="true"
        className={styles.Bubble}
        src="/logo.svg"
      />
      <div className={styles.TaglineSlot}>
        {index !== null ? (
          <p
            className={styles.Tagline}
            key={index}
          >
            {TAGLINES[index]}
          </p>
        ) : null}
      </div>
      <Wordmark />
      <p className={styles.Copyright}>
        © 2026 yapyak
        <span className={styles.Separator}>·</span>
        MIT license
        <span className={styles.Separator}>·</span>
        <a
          className={styles.Link}
          href="https://github.com/yapyak/yapyak"
        >
          GitHub
        </a>
        <span className={styles.Separator}>·</span>
        <a
          className={styles.Link}
          href="https://www.npmjs.com/package/yapyak"
        >
          npm
        </a>
      </p>
    </div>
  );
}

