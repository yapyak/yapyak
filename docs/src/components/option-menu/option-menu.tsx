import type { MenuProps } from '../menu';
import type { SwatchAccent } from '../swatch';

import { Menu } from '../menu';
import { Swatch } from '../swatch';
import styles from './option-menu.module.css';

type OptionMenuItem = {
  label: string;
  value: string;
};

export type OptionMenuProps = Omit<
  MenuProps,
  'aria-label' | 'children' | 'onChange'
> & {
  label: string;
  onChange: (value: string) => void;
  options: OptionMenuItem[];
  value: string;
};

export function OptionMenu(props: OptionMenuProps) {
  const { className, label, onChange, options, value, ...restProps } = props;

  return (
    <Menu
      {...restProps}
      alignment="center"
      aria-label={label}
      className={[
        styles.OptionMenu,
        className,
      ]}
      matchTargetMinWidth={true}
      placement="bottom"
    >
      <Menu.RadioGroup
        aria-label={label}
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <Menu.RadioItem
            key={option.value}
            leadingIcon={<Swatch accent={option.value as SwatchAccent} />}
            value={option.value}
          >
            {option.label}
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
    </Menu>
  );
}
