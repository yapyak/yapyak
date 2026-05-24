import type { ContentNavigationGroupProps } from './content-navigation-group';

import { Link, useLocation } from '@tanstack/react-router';
import { useState } from 'react';

import { Box } from '#components/box';

import {
  childrenContainPath,
  getKey,
  renderChild,
} from './content-navigation-group';
import styles from './content-navigation-group.module.css';
import { ContentNavigationGroupChevronIcon } from './content-navigation-group-chevron-icon';

export function ContentNavigationGroupCollapsible(
  props: ContentNavigationGroupProps,
) {
  const { className, depth, node, ...restProps } = props;
  const location = useLocation();
  const isOnPath = childrenContainPath(node.children, location.pathname);
  const isActive = node.href !== undefined && location.pathname === node.href;
  const [isOpen, setIsOpen] = useState(
    isOnPath || isActive || (node.defaultOpen ?? false),
  );

  return (
    <Box
      {...restProps}
      className={[styles.ContentNavigationGroup, className]}
      data-collapsible
      data-depth={depth}
    >
      <Box
        className={styles.GroupHeader}
        data-active={isActive}
        data-on-path={isOnPath && !isActive}
        data-open={isOpen}
      >
        {node.href === undefined ? (
          <Box
            as="button"
            className={styles.GroupLabel}
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            {node.label}
          </Box>
        ) : (
          <Box
            as={Link}
            className={styles.GroupLabel}
            onClick={() => setIsOpen(true)}
            to={node.href}
          >
            {node.label}
          </Box>
        )}
        <Box
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          as="button"
          className={styles.ChevronButton}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <ContentNavigationGroupChevronIcon />
        </Box>
      </Box>
      {isOpen && (
        <Box
          as="ul"
          className={styles.ItemList}
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
      )}
    </Box>
  );
}
