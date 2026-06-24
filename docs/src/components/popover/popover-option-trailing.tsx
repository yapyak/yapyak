import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

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
