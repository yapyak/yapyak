import { Link } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import { t } from 'yapyak';
import { HeroDemo } from '#components/hero-demo';
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
      <HeroDemo />
    </section>
  );
}
