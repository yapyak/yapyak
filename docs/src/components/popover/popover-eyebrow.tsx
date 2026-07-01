import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './popover.module.css';

export type PopoverEyebrowProps = BoxProps;

export function PopoverEyebrow(props: PopoverEyebrowProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.Eyebrow,
        className,
      ]}
    />
  );
}
