import type { BoxProps } from '../box';

import { Box } from '../box';
import { MenuRadioGroupContext } from './menu-radio-group-context';

export type MenuBaseRadioGroupProps = Omit<BoxProps, 'onChange'> & {
  'aria-label': string;
  onChange: (value: string) => void;
  value: string | undefined;
};

export function MenuBaseRadioGroup(props: MenuBaseRadioGroupProps) {
  const { children, onChange, value, ...restProps } = props;

  return (
    <MenuRadioGroupContext
      value={{
        onChange,
        value,
      }}
    >
      <Box
        {...restProps}
        role="group"
      >
        {children}
      </Box>
    </MenuRadioGroupContext>
  );
}
