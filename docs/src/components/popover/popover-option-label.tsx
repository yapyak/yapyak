import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './popover.module.css';

export type PopoverOptionLabelProps = BoxProps<'span'>;

export function PopoverOptionLabel(props: PopoverOptionLabelProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.OptionLabel,
        className,
      ]}
    />
  );
}
