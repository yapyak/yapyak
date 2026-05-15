import type { ReactElement } from 'react';

import { useEffect, useState } from 'react';

import { Wordmark } from '#components/wordmark';

import styles from './footer.module.css';

const TAGLINES = [
  "Who's yaking in the back? That's yapyak.",
  "Who's keeping i18n on track? That's yapyak.",
  "Who's that yak inside your stack? That's yapyak.",
  "Who's translating while you snack? That's yapyak.",
  "Who's shipping copy at lightning crack? That's yapyak.",
  "Who's that AI-powered i18n hack? That's yapyak.",
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
      <FooterBubble />
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

function FooterBubble(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className={styles.Bubble}
      viewBox="0 0 64 64"
    >
      <defs>
        <linearGradient
          id="footer-bubble"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="var(--aqua)"
          />
          <stop
            offset="100%"
            stopColor="var(--mint)"
          />
        </linearGradient>
      </defs>
      <path
        d="M32 0c17.673 0 32 14.327 32 32s-14.327 32-32 32H8c-4.418 0-8-3.582-8-8V32C0 14.327 14.327 0 32 0ZM16 27a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm16 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm16 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
        fill="url(#footer-bubble)"
        fillRule="evenodd"
      />
    </svg>
  );
}
