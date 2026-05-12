import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { t } from 'yapyak';
import { Wordmark } from '#components/logo';
import { NavLink } from './nav-link';
import styles from './nav.module.css';

export function Nav(): ReactElement {
  return (
    <header className={styles.Nav}>
      <Link to="/" className={styles.LogoLink}>
        <Wordmark />
      </Link>
      <nav className={styles.Pill}>
        <NavLink to="/">{t('Home')}</NavLink>
        <NavLink to="/guide">{t('Guide')}</NavLink>
      </nav>
      <a href="https://github.com/yapyak/yapyak" className={styles.GithubLink}>
        {t('GitHub')}
      </a>
    </header>
  );
}
