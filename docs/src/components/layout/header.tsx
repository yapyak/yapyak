import type { BoxProps } from '#components/box';

import { useEffect, useState } from 'react';

import { Box } from '#components/box';

import { LayoutHeaderCenter } from './header/center';
import { LayoutHeaderEnd } from './header/end';
import { LayoutHeaderStart } from './header/start';
import styles from './header.module.css';

export interface LayoutHeaderProps extends BoxProps<'header'> {}

export function LayoutHeader(props: LayoutHeaderProps) {
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
    <Box
      {...restProps}
      as="header"
      className={[styles.LayoutHeader, className]}
      style={[style, { '--layout-header-fill-opacity': fillOpacity }]}
    >
      <Box className={styles.Fill} />
      {children}
    </Box>
  );
}

LayoutHeader.Start = LayoutHeaderStart;
LayoutHeader.Center = LayoutHeaderCenter;
LayoutHeader.End = LayoutHeaderEnd;
