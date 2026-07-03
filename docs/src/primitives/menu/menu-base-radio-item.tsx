import type { ButtonBaseProps } from '../button';

import { useState } from 'react';

import { ButtonBase } from '../button';
import { useMenuContext } from './menu-context';
import { useMenuRadioGroupContext } from './menu-radio-group-context';
import { useMenuItemBlink } from './use-menu-item-blink';

export type MenuBaseRadioItemProps = ButtonBaseProps & {
  value: string;
};

export function MenuBaseRadioItem(props: MenuBaseRadioItemProps) {
  const { value, ...restProps } = props;

  const menu = useMenuContext();
  const radioGroup = useMenuRadioGroupContext();
  const isChecked = radioGroup.value === value;
  const [isSelecting, setIsSelecting] = useState(false);
  const { blink, isBlinking } = useMenuItemBlink(() => {
    radioGroup.onChange(value);
    menu.onClose();
  });

  const handleClick = () => {
    setIsSelecting(!isChecked);
    blink();
  };

  return (
    <ButtonBase
      {...restProps}
      aria-checked={isChecked}
      data-blinking={isBlinking}
      data-checked={isChecked}
      data-selecting={isSelecting}
      onClick={handleClick}
      role="menuitemradio"
      tabIndex={-1}
    />
  );
}
