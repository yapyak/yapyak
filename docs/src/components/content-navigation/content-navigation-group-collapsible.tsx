import type { ContentNavigationGroupProps } from './content-navigation-group';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';
import { LinkBase } from '#primitives/link';

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
  const [isOpen, setIsOpen] = useState(node.defaultOpen || isOnPath);
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
        styles.ContentNavigationGroup,
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
        {node.href === undefined ? (
          <ButtonBase
            className={styles.GroupToggle}
            onClick={handleToggleClick}
          >
            {node.label}
          </ButtonBase>
        ) : (
          <LinkBase
            className={styles.GroupLink}
            onClick={handleLinkClick}
            to={node.href}
          >
            {node.label}
          </LinkBase>
        )}
        <ButtonBase
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          className={styles.ToggleButton}
          onClick={handleToggleClick}
        >
          <ContentNavigationGroupChevronIcon />
        </ButtonBase>
      </Box>
      <Box
        as="ul"
        className={styles.List}
        hidden={!isOpen}
        ref={listRef}
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
