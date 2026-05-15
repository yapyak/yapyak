import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import type { RefSymbol } from '#docs/build-reference-sidebar';
import styles from './reference-navigation-symbol.module.css';

export interface ReferenceNavigationSymbolProps {
  symbol: RefSymbol;
}

export function ReferenceNavigationSymbol(
  props: ReferenceNavigationSymbolProps,
): ReactElement {
  const { symbol } = props;
  return (
    <Link
      to={symbol.href}
      className={styles.ReferenceNavigationSymbol}
      activeOptions={{ exact: true }}
      data-deprecated={symbol.deprecated ? 'true' : undefined}
    >
      {symbol.name}
    </Link>
  );
}
