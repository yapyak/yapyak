import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './option-dot.module.css';

export type OptionDotProps = BoxProps & {
  value: string;
};

export function OptionDot(props: OptionDotProps) {
  const { className, value, ...restProps } = props;

  return (
    <Box
      {...restProps}
      aria-hidden={true}
      className={[
        styles.OptionDot,
        className,
      ]}
      data-value={value}
    />
  );
}
