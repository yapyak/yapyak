import type { BoxProps } from '#components/box';
import type { SidebarNode } from '#lib/guide';

import { Box } from '#components/box';

import { GuideNavigationGroup } from './guide-navigation/group';
import { GuideNavigationLink } from './guide-navigation/link';
import styles from './guide-navigation.module.css';

export interface GuideNavigationProps extends BoxProps<'nav'> {
  items: SidebarNode[];
}

export function GuideNavigation(props: GuideNavigationProps) {
  const { className, items, ...restProps } = props;

  return (
    <Box
      {...restProps}
      aria-label="Guide navigation"
      as="nav"
      className={[styles.GuideNavigation, className]}
    >
      {items.map((node) =>
        node.type === 'group' ? (
          <GuideNavigationGroup
            depth={0}
            key={`group:${node.title}`}
            node={node}
          />
        ) : (
          <GuideNavigationLink
            key={node.href}
            node={node}
          />
        ),
      )}
    </Box>
  );
}
