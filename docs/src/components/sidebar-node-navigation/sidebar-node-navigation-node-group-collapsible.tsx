import type { SidebarNode } from '@yapyak/doc-compiler';
import type { SidebarNodeNavigationNodeGroupProps } from './sidebar-node-navigation-node-group';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';
import { LinkBase } from '#primitives/link';

import { SidebarNodeNavigationNode } from './sidebar-node-navigation-node';
import styles from './sidebar-node-navigation-node-group.module.css';
import { SidebarNodeNavigationNodeGroupChevronIcon } from './sidebar-node-navigation-node-group-chevron-icon';

export function SidebarNodeNavigationNodeGroupCollapsible(
  props: SidebarNodeNavigationNodeGroupProps,
) {
  const { className, depth, sidebarNode, ...restProps } = props;
  const location = useLocation();
  const isOnPath = childrenContainPath(sidebarNode.children, location.pathname);
  const isActive =
    sidebarNode.href !== undefined && location.pathname === sidebarNode.href;
  const [isOpen, setIsOpen] = useState(sidebarNode.defaultOpen || isOnPath);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOnPath) {
      setIsOpen(true);
    }
  }, [
    isOnPath,
  ]);

  useEffect(() => {
    const element = listRef.current;
    if (element === null) {
      return;
    }
    if (!isOpen) {
      element.setAttribute('hidden', 'until-found');
    }
    const handleBeforeMatch = () => {
      setIsOpen(true);
    };
    element.addEventListener('beforematch', handleBeforeMatch);
    return () => {
      element.removeEventListener('beforematch', handleBeforeMatch);
    };
  }, [
    isOpen,
  ]);

  const handleToggleClick = () => {
    setIsOpen((current) => !current);
  };
  const handleLinkClick = () => {
    setIsOpen(true);
  };

  return (
    <Box
      {...restProps}
      className={[
        styles.SidebarNodeNavigationNodeGroup,
        className,
      ]}
      data-collapsible={true}
      data-depth={depth}
      data-kind="group"
    >
      <Box
        className={styles.GroupBar}
        data-active={isActive}
        data-on-path={isOnPath && !isActive}
        data-open={isOpen}
      >
        {sidebarNode.href === undefined ? (
          <ButtonBase
            className={styles.GroupToggle}
            onClick={handleToggleClick}
          >
            {sidebarNode.label}
          </ButtonBase>
        ) : (
          <LinkBase
            className={styles.GroupLink}
            onClick={handleLinkClick}
            to={sidebarNode.href}
          >
            {sidebarNode.label}
          </LinkBase>
        )}
        <ButtonBase
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          className={styles.ToggleButton}
          onClick={handleToggleClick}
        >
          <SidebarNodeNavigationNodeGroupChevronIcon />
        </ButtonBase>
      </Box>
      <Box
        as="ul"
        className={styles.List}
        hidden={!isOpen}
        ref={listRef}
      >
        {sidebarNode.children.map((child, index) => (
          <Box
            as="li"
            key={index}
          >
            <SidebarNodeNavigationNode
              depth={depth + 1}
              sidebarNode={child}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function childrenContainPath(
  sidebarNodes: SidebarNode[],
  pathname: string,
): boolean {
  for (const sidebarNode of sidebarNodes) {
    if (sidebarNode.kind === 'link' && pathname.startsWith(sidebarNode.href)) {
      return true;
    }
    if (
      sidebarNode.kind === 'group' &&
      childrenContainPath(sidebarNode.children, pathname)
    ) {
      return true;
    }
  }
  return false;
}
