import type {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';

import { useEffect, useState } from 'react';

import { cn } from '#lib/cn';

import styles from './header.module.css';
import { LayoutHeaderCenter } from './header/center';
import { LayoutHeaderEnd } from './header/end';
import { LayoutHeaderStart } from './header/start';

export interface LayoutHeaderProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function LayoutHeader(props: LayoutHeaderProps): ReactElement {
  const { children, className, style, ...restProps } = props;
  const [fillOpacity, setFillOpacity] = useState(0);

  useEffect(() => {
    const update = () => {
      setFillOpacity(Math.min(window.scrollY / 40, 1));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      {...restProps}
      className={cn(styles.LayoutHeader, className)}
      style={{ ...style, '--fill-opacity': fillOpacity } as CSSProperties}
    >
      <div className={styles.Fill} />
      {children}
    </header>
  );
}

LayoutHeader.Start = LayoutHeaderStart;
LayoutHeader.Center = LayoutHeaderCenter;
LayoutHeader.End = LayoutHeaderEnd;
