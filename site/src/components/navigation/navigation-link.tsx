import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '#lib/cn';
import styles from './navigation-link.module.css';

export type NavigationLinkProps = Omit<LinkProps, 'className'> & {
  children?: ReactNode;
  className?: string;
};

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
