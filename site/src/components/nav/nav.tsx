import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { t } from 'yapyak';
import { Wordmark } from '../logo';

export function Nav(): ReactElement {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center">
        <Wordmark />
      </Link>
      <nav className="flex items-center gap-1 rounded-full bg-surface p-1">
        <NavLink to="/">{t('Home')}</NavLink>
        <NavLink to="/guide">{t('Guide')}</NavLink>
      </nav>
      <a
        href="https://github.com/yapyak/yapyak"
        className="text-ink-300 hover:text-ink-50"
      >
        {t('GitHub')}
      </a>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  children: ReactElement | string;
}

function NavLink(props: NavLinkProps): ReactElement {
  const { to, children } = props;
  return (
    <Link
      to={to}
      className="rounded-full px-4 py-1.5 text-sm font-medium text-ink-300 hover:text-ink-50"
      activeProps={{
        className: 'bg-mint-400 text-bg',
      }}
    >
      {children}
    </Link>
  );
}
