import type { SidebarNodeNavigationGroupProps } from './sidebar-node-navigation-group';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';
import { LinkBase } from '#primitives/link';

import {
  childrenContainPath,
  getKey,
  renderChild,
} from './sidebar-node-navigation-group';
import styles from './sidebar-node-navigation-group.module.css';
import { SidebarNodeNavigationGroupChevronIcon } from './sidebar-node-navigation-group-chevron-icon';

export function SidebarNodeNavigationGroupCollapsible(
  props: SidebarNodeNavigationGroupProps,
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
        styles.SidebarNodeNavigationGroup,
        className,
      ]}
      data-collapsible={true}
      data-depth={depth}
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
          <SidebarNodeNavigationGroupChevronIcon />
        </ButtonBase>
      </Box>
      <Box
        as="ul"
        className={styles.List}
        hidden={!isOpen}
        ref={listRef}
      >
        {sidebarNode.children.map((child) => (
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
