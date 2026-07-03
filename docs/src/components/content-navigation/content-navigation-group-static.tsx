import type { ContentNavigationGroupProps } from './content-navigation-group';

import { useLocation } from '@tanstack/react-router';

import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import { getKey, renderChild } from './content-navigation-group';
import styles from './content-navigation-group.module.css';

export function ContentNavigationGroupStatic(
  props: ContentNavigationGroupProps,
) {
  const { className, depth, node, ...restProps } = props;
  const location = useLocation();
  const isActive = node.href !== undefined && location.pathname === node.href;

  return (
    <Box
      {...restProps}
      className={[
        styles.ContentNavigationGroup,
        className,
      ]}
      data-depth={depth}
    >
      {node.href === undefined ? (
        <Box
          as="h3"
          className={styles.TitleHeading}
        >
          {node.label}
        </Box>
      ) : (
        <LinkBase
          className={styles.TitleLink}
          data-active={isActive}
          to={node.href}
        >
          {node.label}
        </LinkBase>
      )}
      <Box
        as="ul"
        className={styles.List}
      >
        {node.children.map((child) => (
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
