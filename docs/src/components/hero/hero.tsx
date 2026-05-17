import type { ReactElement } from 'react';

import { Link } from '@tanstack/react-router';
import { t } from 'yapyak';

import { HeroDemo } from '#components/hero-demo';

import styles from './hero.module.css';

export interface HeroProps {
  description: string;
  heading: string;
}

export function Hero(props: HeroProps): ReactElement {
  const { heading, description } = props;
  return (
    <section className={styles.Hero}>
      <div className={styles.Stack}>
        <h1 className={styles.Heading}>{heading}</h1>
        <p className={styles.Description}>{description}</p>
        <div className={styles.Actions}>
          <Link
            className={styles.PrimaryButton}
            to="/guide"
          >
            {t('Get Started')}
          </Link>
          <a
            className={styles.SecondaryButton}
            href="https://github.com/yapyak/yapyak"
          >
            {t('View on GitHub')}
          </a>
        </div>
        <p className={styles.Trust}>
          {t('Open source. Use any LLM. No middleman.')}
        </p>
      </div>
      <HeroDemo />
    </section>
  );
}
