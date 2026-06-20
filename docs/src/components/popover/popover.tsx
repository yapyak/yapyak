import type { ReactNode } from 'react';
import type { ClassName } from '#types';

import { Box } from '#components/box';

import styles from './popover.module.css';

export type PopoverAlignment = 'center' | 'end' | 'start';

export type PopoverProps = {
  align?: PopoverAlignment;
  anchorName: string;
  children: ReactNode;
  className?: ClassName;
  id: string;
};

export function Popover(props: PopoverProps) {
  const { align = 'end', anchorName, children, className, id } = props;

  return (
    <Box
      className={[
        styles.Popover,
        className,
      ]}
      data-align={align}
      id={id}
      popover="auto"
      style={{
        '--popover-anchor': anchorName,
      }}
    >
      {children}
    </Box>
  );
}
