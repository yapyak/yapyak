import type { BoxProps } from '../box';

import { Box } from '../box';

export type MenuBaseDividerProps = BoxProps;

export function MenuBaseDivider(props: MenuBaseDividerProps) {
  return (
    <Box
      {...props}
      role="separator"
    />
  );
}
