import type { ButtonBaseProps } from '../button';

import { ButtonBase } from '../button';
import { useMenuContext } from './menu-context';
import { useMenuRadioGroupContext } from './menu-radio-group-context';

export type MenuBaseRadioItemProps = ButtonBaseProps & {
  value: string;
};

export function MenuBaseRadioItem(props: MenuBaseRadioItemProps) {
  const { value, ...restProps } = props;

  const menu = useMenuContext();
  const radioGroup = useMenuRadioGroupContext();
  const isChecked = radioGroup.value === value;

  const handleClick = () => {
    radioGroup.onChange(value);
    menu.onClose();
  };

  return (
    <ButtonBase
      {...restProps}
      aria-checked={isChecked}
      data-checked={isChecked}
      onClick={handleClick}
      role="menuitemradio"
      tabIndex={-1}
    />
  );
}
