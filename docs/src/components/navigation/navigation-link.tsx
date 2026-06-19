import type { ComponentProps } from 'react';

import { Link } from '@tanstack/react-router';

import { mergeClassNames } from '#utils/merge-class-names';

import styles from './navigation-link.module.css';

export type NavigationLinkProps = ComponentProps<typeof Link>;

export function NavigationLink(props: NavigationLinkProps) {
  const { className, ...restProps } = props;

  return (
    <Link
      {...restProps}
      className={mergeClassNames(styles.NavigationLink, className)}
    />
  );
}
