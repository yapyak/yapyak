import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { MouseEvent } from 'react';
import type { LinkBaseProps } from '#primitives/link';

import { LinkBase } from '#primitives/link';

import styles from './content-anchor-navigation-item.module.css';

export type ContentAnchorNavigationItemProps = LinkBaseProps & {
  active: boolean;
  heading: HeadingEntry;
  onActivate: (id: string) => void;
};

export function ContentAnchorNavigationItem(
  props: ContentAnchorNavigationItemProps,
) {
  const { active, className, heading, onActivate, ...restProps } = props;

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
    <LinkBase
      {...restProps}
      className={[
        styles.ContentAnchorNavigationItem,
        className,
      ]}
      data-active={active}
      data-level={heading.level}
      hash={heading.id}
      hashScrollIntoView={false}
      onClick={handleClick}
      to="."
    >
      {heading.text}
    </LinkBase>
  );
}
