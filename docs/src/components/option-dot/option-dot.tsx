import { Box } from '#components/box';

import styles from './option-dot.module.css';

export type OptionDotProps = {};

export function OptionDot(_props: OptionDotProps) {
  return (
    <Box
      aria-hidden="true"
      className={styles.OptionDot}
    />
  );
}
