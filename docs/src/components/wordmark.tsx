import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './wordmark.module.css';

export interface WordmarkProps extends BoxProps<'span'> {}

export function Wordmark(props: WordmarkProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[styles.Wordmark, className]}
    >
      <Box
        as="span"
        className={styles.YapText}
      >
        yap
      </Box>
      <Box
        as="span"
        className={styles.YakText}
      >
        yak
      </Box>
    </Box>
  );
}
