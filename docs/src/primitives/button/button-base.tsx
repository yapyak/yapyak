import type { BoxProps } from '../box';

import { Box } from '../box';

export type ButtonBaseProps = BoxProps<'button'>;

export function ButtonBase(props: ButtonBaseProps) {
  const { type = 'button', ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="button"
      type={type}
    />
  );
}
