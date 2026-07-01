import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './popover.module.css';

export type PopoverOptionTrailingProps = BoxProps<'span'>;

export function PopoverOptionTrailing(props: PopoverOptionTrailingProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.OptionTrailing,
        className,
      ]}
    />
  );
}
