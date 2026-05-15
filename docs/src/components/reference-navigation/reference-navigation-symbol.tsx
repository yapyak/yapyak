import type { ReactElement } from 'react';
import type { RefSymbol } from '#docs/build-reference-sidebar';

import { Link } from '@tanstack/react-router';

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
      activeOptions={{ exact: true }}
      className={styles.ReferenceNavigationSymbol}
      data-deprecated={symbol.deprecated ? 'true' : undefined}
      to={symbol.href}
    >
      {symbol.name}
    </Link>
  );
}
