import type { BoxProps } from '#components/box';
import type { SidebarGroup, SidebarNode } from '#lib/sidebars';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import styles from './group.module.css';
import { GuideNavigationLink } from './link';

export interface GuideNavigationGroupProps extends BoxProps {
  depth: number;
  node: SidebarGroup;
}

export function GuideNavigationGroup(props: GuideNavigationGroupProps) {
  const { className, depth, node, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.GuideNavigationGroup, className]}
      data-depth={depth}
    >
      <Title node={node} />
      <Box
        as="ul"
        className={styles.Items}
      >
        {node.items.map((child) => (
          <Box
            as="li"
            key={getKey(child)}
          >
            {renderChild(child, depth + 1)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

interface TitleProps {
  node: SidebarGroup;
}

function Title(props: TitleProps) {
  const { node } = props;

  if (node.href === undefined) {
    return (
      <Box
        as="h3"
        className={styles.Title}
      >
        {node.title}
      </Box>
    );
  }
  return (
    <Box
      as={Link}
      className={styles.TitleLink}
      to={node.href}
    >
      {node.title}
    </Box>
  );
}

function renderChild(child: SidebarNode, depth: number) {
  if (child.type === 'group') {
    return (
      <GuideNavigationGroup
        depth={depth}
        node={child}
      />
    );
  }
  return <GuideNavigationLink node={child} />;
}

function getKey(node: SidebarNode): string {
  if (node.type === 'link') {
    return node.href;
  }
  return `group:${node.title}`;
}
