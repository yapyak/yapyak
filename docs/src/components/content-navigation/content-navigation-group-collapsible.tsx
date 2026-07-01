import type { ContentNavigationGroupProps } from './content-navigation-group';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (isOnPath) {
      setIsOpen(true);
    }
  }, [
    isOnPath,
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
        className={styles.GroupHeader}
        data-active={isActive}
        data-on-path={isOnPath && !isActive}
        data-open={isOpen}
      >
        {node.href === undefined ? (
          <ButtonBase
            className={styles.GroupLabel}
            onClick={handleToggleClick}
          >
            {node.label}
          </ButtonBase>
        ) : (
          <LinkBase
            className={styles.GroupLabel}
            onClick={handleLinkClick}
            to={node.href}
          >
            {node.label}
          </LinkBase>
        )}
        <ButtonBase
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          className={styles.ChevronButton}
          onClick={handleToggleClick}
        >
          <ContentNavigationGroupChevronIcon />
        </ButtonBase>
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
