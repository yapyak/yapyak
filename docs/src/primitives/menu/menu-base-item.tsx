import type { ButtonBaseProps } from '../button';

import { ButtonBase } from '../button';
import { useMenuContext } from './menu-context';

export type MenuBaseItemProps = ButtonBaseProps & {
  onSelect?: () => void;
};

export function MenuBaseItem(props: MenuBaseItemProps) {
  const { onSelect, ...restProps } = props;

  const menu = useMenuContext();

  const handleClick = () => {
    onSelect?.();
    menu.onClose();
  };

  return (
    <ButtonBase
      {...restProps}
      onClick={handleClick}
      role="menuitem"
      tabIndex={-1}
    />
  );
}
