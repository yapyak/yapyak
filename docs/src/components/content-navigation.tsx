import type { BoxProps } from '#components/box';
import type { NavNode } from '#lib/navigation';

import { Box } from '#components/box';

import { ContentNavigationGroup } from './content-navigation/group';
import { ContentNavigationLink } from './content-navigation/link';
import styles from './content-navigation.module.css';

export interface ContentNavigationProps extends BoxProps<'nav'> {
  tree: NavNode[];
}

export function ContentNavigation(props: ContentNavigationProps) {
  const { className, tree, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="nav"
      className={[styles.ContentNavigation, className]}
    >
      {tree.map((node) =>
        node.type === 'group' ? (
          <ContentNavigationGroup
            depth={0}
            key={`group:${node.label}`}
            node={node}
          />
        ) : (
          <ContentNavigationLink
            key={node.href}
            node={node}
          />
        ),
      )}
    </Box>
  );
}
