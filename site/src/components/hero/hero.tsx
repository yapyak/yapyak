import { Link } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import { t } from 'yapyak';
import styles from './hero.module.css';

export interface HeroProps {
  heading: string;
  description: string;
}

const HIGHLIGHT_PATTERN = /(\bi18n\b|\bVite\b)/g;

function highlightHeading(text: string): ReactNode[] {
  const parts = text.split(HIGHLIGHT_PATTERN);
  return parts.map((part, index) => {
    if (HIGHLIGHT_PATTERN.test(part)) {
      HIGHLIGHT_PATTERN.lastIndex = 0;
      return (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: stable split order
          key={index}
          className={styles.HeadingHighlight}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function Hero(props: HeroProps): ReactElement {
  const { heading, description } = props;
  return (
    <section className={styles.Hero}>
      <div className={styles.Stack}>
        <h1 className={styles.Heading}>{highlightHeading(heading)}</h1>
        <p className={styles.Description}>{description}</p>
        <div className={styles.Actions}>
          <Link to="/guide" className={styles.PrimaryButton}>
            {t('Get Started')}
          </Link>
          <a
            href="https://github.com/yapyak/yapyak"
            className={styles.SecondaryButton}
          >
            {t('View on GitHub')}
          </a>
        </div>
      </div>
      <HeroMark />
    </section>
  );
}

function HeroMark(): ReactElement {
  return (
    <div className={styles.Mark}>
      <div className={styles.Glow} />
      <svg
        viewBox="0 0 64 64"
        className={styles.Svg}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hero-bubble" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--aqua)" />
            <stop offset="100%" stopColor="var(--mint)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#hero-bubble)"
          fillRule="evenodd"
          d="M32 0c17.673 0 32 14.327 32 32s-14.327 32-32 32H8c-4.418 0-8-3.582-8-8V32C0 14.327 14.327 0 32 0ZM16 27a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm16 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm16 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
        />
      </svg>
    </div>
  );
}
