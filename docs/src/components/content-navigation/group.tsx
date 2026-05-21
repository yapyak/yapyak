import type { SidebarGroup, SidebarNode } from '@yapyak/doc-extractor';
import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';

import { Box } from '#components/box';

import styles from './group.module.css';
import { ContentNavigationLink } from './link';

export interface ContentNavigationGroupProps extends BoxProps {
  depth: number;
  node: SidebarGroup;
}

export function ContentNavigationGroup(props: ContentNavigationGroupProps) {
  const { className, depth, node, ...restProps } = props;

  if (node.collapsible) {
    return (
      <CollapsibleGroup
        {...restProps}
        className={className}
        depth={depth}
        node={node}
      />
    );
  }
  return (
    <StaticGroup
      {...restProps}
      className={className}
      depth={depth}
      node={node}
    />
  );
}

function StaticGroup(props: ContentNavigationGroupProps) {
  const { className, depth, node, ...restProps } = props;
  return (
    <Box
      {...restProps}
      className={[styles.ContentNavigationGroup, className]}
      data-depth={depth}
    >
      <Box
        as="h3"
        className={styles.TitleHeading}
      >
        {node.label}
      </Box>
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
    </Box>
  );
}

function CollapsibleGroup(props: ContentNavigationGroupProps) {
  const { className, depth, node, ...restProps } = props;
  const location = useLocation();
  const isOnPath = childrenContainPath(node.children, location.pathname);
  const [isOpen, setIsOpen] = useState(isOnPath);

  return (
    <Box
      {...restProps}
      className={[styles.ContentNavigationGroup, className]}
      data-collapsible
      data-depth={depth}
    >
      <Box
        aria-expanded={isOpen}
        as="button"
        className={styles.ToggleButton}
        data-open={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Box
          as="span"
          className={styles.ToggleLabel}
        >
          {node.label}
        </Box>
        <ChevronIcon />
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

function renderChild(child: SidebarNode, depth: number) {
  if (child.type === 'group') {
    return (
      <ContentNavigationGroup
        depth={depth}
        node={child}
      />
    );
  }
  return <ContentNavigationLink node={child} />;
}

function getKey(node: SidebarNode) {
  if (node.type === 'link') {
    return node.href;
  }
  return `group:${node.label}`;
}

function childrenContainPath(nodes: SidebarNode[], pathname: string): boolean {
  for (const node of nodes) {
    if (node.type === 'link' && pathname.startsWith(node.href)) {
      return true;
    }
    if (node.type === 'group' && childrenContainPath(node.children, pathname)) {
      return true;
    }
  }
  return false;
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.ChevronIcon}
      height="10"
      viewBox="0 0 10 10"
      width="10"
    >
      <path
        d="M3.5 2L7 5L3.5 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}
