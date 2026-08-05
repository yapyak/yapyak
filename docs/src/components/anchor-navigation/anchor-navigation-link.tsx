import type { Anchor } from '@yapyak/docs-compiler';
import type { MouseEvent } from 'react';
import type { LinkBaseProps } from '#primitives/link';

import { LinkBase } from '#primitives/link';

import styles from './anchor-navigation-link.module.css';

export type AnchorNavigationLinkProps = LinkBaseProps & {
  active: boolean;
  anchor: Anchor;
  onActivate: (id: string) => void;
};

export function AnchorNavigationLink(props: AnchorNavigationLinkProps) {
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
        styles.AnchorNavigationLink,
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
