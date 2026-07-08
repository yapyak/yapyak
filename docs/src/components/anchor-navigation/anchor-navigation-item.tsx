import type { Anchor } from '@yapyak/doc-compiler';
import type { MouseEvent } from 'react';
import type { LinkBaseProps } from '#primitives/link';

import { LinkBase } from '#primitives/link';

import styles from './anchor-navigation-item.module.css';

export type AnchorNavigationItemProps = LinkBaseProps & {
  active: boolean;
  anchor: Anchor;
  onActivate: (id: string) => void;
};

export function AnchorNavigationItem(props: AnchorNavigationItemProps) {
  const { active, className, anchor, onActivate, ...restProps } = props;

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
    onActivate(anchor.id);
  };

  return (
    <LinkBase
      {...restProps}
      className={[
        styles.AnchorNavigationItem,
        className,
      ]}
      data-active={active}
      data-level={anchor.level}
      hash={anchor.id}
      onClick={handleClick}
      to="."
    >
      {anchor.text}
    </LinkBase>
  );
}
