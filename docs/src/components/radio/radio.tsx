import type { RadioBaseProps } from '#primitives/radio';

import { Box } from '#primitives/box';
import { RadioBase } from '#primitives/radio';

import styles from './radio.module.css';

export type RadioProps = RadioBaseProps;

export function Radio(props: RadioProps) {
  const { children, className, ...restProps } = props;

  return (
    <RadioBase
      {...restProps}
      className={[
        styles.Radio,
        className,
      ]}
    >
      <Box
        aria-hidden={true}
        className={styles.Indicator}
      />
      {children !== undefined && (
        <Box
          as="span"
          className={styles.Label}
        >
          {children}
        </Box>
      )}
    </RadioBase>
  );
}
