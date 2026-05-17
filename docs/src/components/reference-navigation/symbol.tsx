import type { RefSymbol } from '#docs/build-reference-sidebar';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import styles from './symbol.module.css';

export interface ReferenceNavigationSymbolProps {
  symbol: RefSymbol;
}

export function ReferenceNavigationSymbol(
  props: ReferenceNavigationSymbolProps,
) {
  const { symbol } = props;

  return (
    <Box
      activeOptions={{ exact: true }}
      as={Link}
      className={styles.ReferenceNavigationSymbol}
      data-deprecated={symbol.isDeprecated}
      to={symbol.href}
    >
      {symbol.name}
    </Box>
  );
}
