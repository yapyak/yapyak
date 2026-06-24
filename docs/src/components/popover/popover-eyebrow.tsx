import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

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
