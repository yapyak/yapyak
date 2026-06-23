import type { SidebarNode } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content-navigation.module.css';
import { ContentNavigationGroup } from './content-navigation-group';
import { ContentNavigationLink } from './content-navigation-link';

export type ContentNavigationProps = BoxProps<'nav'> & {
  tree: SidebarNode[];
};

export function ContentNavigation(props: ContentNavigationProps) {
  const { className, tree, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="nav"
      className={[
        styles.ContentNavigation,
        className,
      ]}
    >
      {tree.map((node) =>
        node.type === 'group' ? (
          <ContentNavigationGroup
            className={
              node.collapsible ? styles.CollapsibleGroup : styles.StaticGroup
            }
            depth={0}
            key={`group:${node.label}`}
            node={node}
          />
        ) : (
          <ContentNavigationLink
            className={styles.Link}
            key={node.href}
            node={node}
          />
        ),
      )}
    </Box>
  );
}
