import type { BoxProps } from '#components/box';
import type { ReferenceSidebar as ReferenceSidebarData } from '#docs/build-reference-sidebar';

import { Box } from '#components/box';

import styles from './reference-navigation.module.css';
import { ReferenceNavigationModule } from './reference-navigation/module';
import { ReferenceNavigationSymbol } from './reference-navigation/symbol';

export interface ReferenceNavigationProps extends BoxProps<'nav'> {
  data: ReferenceSidebarData;
}

export function ReferenceNavigation(props: ReferenceNavigationProps) {
  const { className, data, ...restProps } = props;
  const root = data.modules.find((m) => m.id === 'yapyak');

  if (!root) {
    return (
      <Box
        aria-label="Reference navigation"
        {...restProps}
        as="nav"
        className={[styles.ReferenceNavigation, className]}
      />
    );
  }

  return (
    <Box
      aria-label="Reference navigation"
      {...restProps}
      as="nav"
      className={[styles.ReferenceNavigation, className]}
    >
      <Box
        as="ul"
        className={styles.ItemList}
      >
        {root.symbols.map((symbol) => (
          <Box
            as="li"
            key={symbol.href}
          >
            <ReferenceNavigationSymbol symbol={symbol} />
          </Box>
        ))}
        {root.submodules.map((submodule) => (
          <Box
            as="li"
            key={submodule.id}
          >
            <ReferenceNavigationModule module={submodule} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
