import type { ButtonBaseProps } from '../button';

import { ButtonBase } from '../button';
import { useMenuContext } from './menu-context';
import { useMenuItemBlink } from './use-menu-item-blink';

export type MenuBaseItemProps = ButtonBaseProps & {
  onSelect?: () => void;
};

export function MenuBaseItem(props: MenuBaseItemProps) {
  const { onSelect, ...restProps } = props;

  const menu = useMenuContext();
  const { blink, isBlinking } = useMenuItemBlink(menu.onClose);

  const handleClick = () => {
    onSelect?.();
    blink();
  };

  return (
    <ButtonBase
      {...restProps}
      data-blinking={isBlinking}
      onClick={handleClick}
      role="menuitem"
      tabIndex={-1}
    />
  );
}
