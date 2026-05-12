import { Link } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import styles from './nav-link.module.css';

export interface NavLinkProps {
  to: string;
  children: ReactNode;
}

export function NavLink(props: NavLinkProps): ReactElement {
  const { to, children } = props;
  return (
    <Link to={to} className={styles.NavLink}>
      {children}
    </Link>
  );
}
