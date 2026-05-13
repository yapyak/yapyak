import { Link } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import { t } from 'yapyak';
import { HeroDemo } from '#components/hero-demo';
import styles from './hero.module.css';

export interface HeroProps {
  heading: string;
  description: string;
}

export function Hero(props: HeroProps): ReactElement {
  const { heading, description } = props;
  return (
    <section className={styles.Hero}>
      <div className={styles.Stack}>
        <h1 className={styles.Heading}>{heading}</h1>
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
