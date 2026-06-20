import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { MouseEvent, Ref } from 'react';

import { Link } from '@tanstack/react-router';

import styles from './content-anchor-navigation-item.module.css';

export type ContentAnchorNavigationItemProps = {
  active: boolean;
  heading: HeadingEntry;
  onActivate: (id: string) => void;
  ref?: Ref<HTMLAnchorElement>;
};

export function ContentAnchorNavigationItem(
  props: ContentAnchorNavigationItemProps,
) {
  const { active: isActive, heading, onActivate, ref } = props;

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
