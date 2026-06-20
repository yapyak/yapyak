import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { MouseEvent, Ref } from 'react';

import { Link } from '@tanstack/react-router';

import styles from './content-anchor-navigation-item.module.css';

export type ContentAnchorNavigationItemProps = {
  heading: HeadingEntry;
  isActive: boolean;
  onActivate: (id: string) => void;
  ref?: Ref<HTMLAnchorElement>;
};

export function ContentAnchorNavigationItem(
  props: ContentAnchorNavigationItemProps,
) {
  const { heading, isActive, onActivate, ref } = props;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    onActivate(heading.id);
  };

  return (
    <Link
      className={styles.ContentAnchorNavigationItem}
      data-active={isActive ? '' : undefined}
      data-level={heading.level}
      hash={heading.id}
      hashScrollIntoView={false}
      onClick={handleClick}
      ref={ref}
      to="."
    >
      {heading.text}
    </Link>
  );
}
