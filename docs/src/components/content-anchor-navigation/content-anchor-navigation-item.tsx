import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { Ref } from 'react';

import { Link } from '@tanstack/react-router';

import styles from './content-anchor-navigation-item.module.css';

export type ContentAnchorNavigationItemProps = {
  heading: HeadingEntry;
  isActive: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

export function ContentAnchorNavigationItem(
  props: ContentAnchorNavigationItemProps,
) {
  const { heading, isActive, ref } = props;

  return (
    <Link
      className={styles.ContentAnchorNavigationItem}
      data-active={isActive ? '' : undefined}
      data-level={heading.level}
      hash={heading.id}
      ref={ref}
      to="."
    >
      {heading.text}
    </Link>
  );
}
