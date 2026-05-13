import type { ReactElement } from 'react';
import { Wordmark } from '#components/wordmark';
import styles from './footer.module.css';

export function Footer(): ReactElement {
  return (
    <div className={styles.Footer}>
      <FooterBubble />
      <p className={styles.Tagline}>
        Who's yaking in the back? That's yapyak.
      </p>
      <Wordmark />
      <p className={styles.Copyright}>
        © 2026 yapyak
        <span className={styles.Separator}>·</span>
        MIT license
        <span className={styles.Separator}>·</span>
        <a
          href="https://github.com/yapyak/yapyak"
          className={styles.Link}
        >
          GitHub
        </a>
        <span className={styles.Separator}>·</span>
        <a
          href="https://www.npmjs.com/package/yapyak"
          className={styles.Link}
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
      viewBox="0 0 64 64"
      className={styles.Bubble}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="footer-bubble" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--aqua)" />
          <stop offset="100%" stopColor="var(--mint)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#footer-bubble)"
        fillRule="evenodd"
        d="M32 0c17.673 0 32 14.327 32 32s-14.327 32-32 32H8c-4.418 0-8-3.582-8-8V32C0 14.327 14.327 0 32 0ZM16 27a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm16 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm16 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
      />
    </svg>
  );
}
