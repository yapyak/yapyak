import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import type { RefSymbol } from '#docs/build-reference-sidebar';
import styles from './reference-sidebar-symbol.module.css';

export interface ReferenceSidebarSymbolProps {
  symbol: RefSymbol;
}

export function ReferenceSidebarSymbol(
  props: ReferenceSidebarSymbolProps,
): ReactElement {
  const { symbol } = props;
  return (
    <Link
      to={symbol.href}
      className={styles.ReferenceSidebarSymbol}
      activeOptions={{ exact: true }}
      data-deprecated={symbol.deprecated ? 'true' : undefined}
    >
      {symbol.name}
    </Link>
  );
}
