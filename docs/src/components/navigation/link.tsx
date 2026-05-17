import type { LinkProps } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import { cn } from '#lib/cn';

import styles from './link.module.css';

export interface NavigationLinkProps extends Omit<LinkProps, 'className'> {
  children?: ReactNode;
  className?: string;
}

export function NavigationLink(props: NavigationLinkProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <Link
      {...restProps}
      className={cn(
        styles.NavigationLink,
        typeof className === 'string' ? className : undefined,
      )}
    >
      {children}
    </Link>
  );
}
