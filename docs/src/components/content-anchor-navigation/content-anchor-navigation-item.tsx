import type { HeadingEntry } from '@yapyak/doc-extractor';
import type { MouseEvent, Ref } from 'react';

import { Box } from '#components/box';

import styles from './content-anchor-navigation-item.module.css';

export interface ContentAnchorNavigationItemProps {
  heading: HeadingEntry;
  isActive: boolean;
  onActivate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
  ref?: Ref<HTMLAnchorElement>;
}

export function ContentAnchorNavigationItem(
  props: ContentAnchorNavigationItemProps,
) {
  const { heading, isActive, onActivate, ref } = props;

  return (
    <Box
      as="a"
      className={styles.ContentAnchorNavigationItem}
      data-active={isActive ? '' : undefined}
      data-level={heading.level}
      href={`#${heading.id}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onActivate(event, heading.id);
      }}
      ref={ref}
    >
      {heading.text}
    </Box>
  );
}
