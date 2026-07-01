import type { ReactElement } from 'react';
import type { BoxProps } from '#primitives/box';
import type { UseRadioGroupOptions } from './use-radio-group';

import { Box } from '#primitives/box';

import { RadioGroupContext } from './radio-group-context';
import { useRadioGroup } from './use-radio-group';

export type RadioGroupBaseProps = Omit<BoxProps, 'defaultValue' | 'onChange'> &
  UseRadioGroupOptions;

export function RadioGroupBase(props: RadioGroupBaseProps): ReactElement {
  const {
    children,
    defaultValue,
    disabled,
    name,
    onChange,
    value,
    ...restProps
  } = props;

  const group = useRadioGroup({
    defaultValue,
    disabled,
    name,
    onChange,
    value,
  });

  return (
    <RadioGroupContext value={group.contextValue}>
      <Box
        {...restProps}
        {...group.radioGroupProps}
      >
        {children}
      </Box>
    </RadioGroupContext>
  );
}
