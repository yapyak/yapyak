import type { SVGProps } from 'react';

import { Box } from '#primitives/box';

import styles from './option-dot.module.css';

export type OptionDotProps = SVGProps<SVGSVGElement>;

export function OptionDot(_props: OptionDotProps) {
  return (
    <Box
      aria-hidden="true"
      className={styles.OptionDot}
    />
  );
}
