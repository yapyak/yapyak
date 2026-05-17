import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import styles from './icon-link.module.css';

export interface IconLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
}

export function IconLink(props: IconLinkProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <a
      {...restProps}
      className={cn(styles.IconLink, className)}
    >
      {children}
    </a>
  );
}
