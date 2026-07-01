import type { BoxProps } from '../box';

import { Box } from '../box';
import { MenuContext } from './menu-context';
import { useMenuNavigation } from './use-menu-navigation';

export type MenuBaseProps = BoxProps & {
  'aria-label': string;
  onClose: () => void;
};

export function MenuBase(props: MenuBaseProps) {
  const { children, onClose, ...restProps } = props;

  const { onKeyDown, ref } = useMenuNavigation();

  return (
    <MenuContext
      value={{
        onClose,
      }}
    >
      <Box
        {...restProps}
        onKeyDown={onKeyDown}
        ref={ref}
        role="menu"
      >
        {children}
      </Box>
    </MenuContext>
  );
}
