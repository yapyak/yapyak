import type { LinkBaseProps } from '#primitives/link';

import { LinkBase } from '#primitives/link';
import { mergeClassNames } from '#utils/merge-class-names';

import styles from './navigation-link.module.css';

export type NavigationLinkProps = LinkBaseProps;

export function NavigationLink(props: NavigationLinkProps) {
  const { className, ...restProps } = props;

  return (
    <LinkBase
      {...restProps}
      className={mergeClassNames(styles.NavigationLink, className)}
    />
  );
}
