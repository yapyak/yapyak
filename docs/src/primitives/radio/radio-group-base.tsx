import type { BoxProps } from '../box';

import { useId } from 'react';

import { useControllableState } from '#hooks/use-controllable-state';

import { Box } from '../box';
import { RadioGroupContext } from './radio-group-context';

export type RadioGroupBaseProps = Omit<
  BoxProps,
  'defaultValue' | 'onChange'
> & {
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: string) => void;
  value?: string;
};

export function RadioGroupBase(props: RadioGroupBaseProps) {
  const {
    children,
    defaultValue,
    disabled = false,
    name,
    onChange,
    value: controlledValue,
    ...restProps
  } = props;

  const generatedName = useId();
  const resolvedName = name ?? generatedName;

  const [value, setValue] = useControllableState<string>({
    defaultValue,
    onChange,
    value: controlledValue,
  });

  return (
    <RadioGroupContext
      value={{
        disabled,
        name: resolvedName,
        setValue,
        value,
      }}
    >
      <Box
        {...restProps}
        aria-disabled={disabled ? true : undefined}
        role="radiogroup"
      >
        {children}
      </Box>
    </RadioGroupContext>
  );
}
