import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { t } from 'yapyak';
import { GitHubIcon } from '#components/icon';
import { Wordmark } from '#components/logo';
import { Navigation } from '#components/navigation';
import styles from './nav.module.css';

export function Nav(): ReactElement {
  return (
    <header className={styles.Nav}>
      <Link to="/" className={styles.LogoLink}>
        <Wordmark />
      </Link>
      <Navigation>
        <Navigation.Link to="/">{t('Home')}</Navigation.Link>
        <Navigation.Link to="/guide">{t('Guide')}</Navigation.Link>
        <Navigation.Link to="/reference">{t('Reference')}</Navigation.Link>
      </Navigation>
      <a
        href="https://github.com/yapyak/yapyak"
        className={styles.GithubLink}
        aria-label={t('View on GitHub')}
      >
        <GitHubIcon />
      </a>
    </header>
  );
}
