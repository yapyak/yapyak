import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { MouseEvent } from 'react';
import type { LinkBaseProps } from '#primitives/link';

import { LinkBase } from '#primitives/link';

import styles from './page-anchor-navigation-item.module.css';

export type PageAnchorNavigationItemProps = LinkBaseProps & {
  active: boolean;
  heading: HeadingEntry;
  onActivate: (id: string) => void;
};

export function PageAnchorNavigationItem(props: PageAnchorNavigationItemProps) {
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
        styles.PageAnchorNavigationItem,
        className,
      ]}
      data-active={active}
      data-level={heading.level}
      hash={heading.id}
      onClick={handleClick}
      to="."
    >
      {heading.text}
    </LinkBase>
  );
}
