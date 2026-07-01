import type { BoxProps } from '../box';

import { Box } from '../box';

export type MenuBaseSeparatorProps = BoxProps;

export function MenuBaseSeparator(props: MenuBaseSeparatorProps) {
  return (
    <Box
      {...props}
      role="separator"
    />
  );
}
