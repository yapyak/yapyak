import type { RadioGroupContextValue } from './radio-group-context';

import { useId } from 'react';

import { useControllableState } from '#hooks/use-controllable-state';

export type UseRadioGroupOptions = {
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: string) => void;
  value?: string;
};

export type UseRadioGroupReturn = {
  contextValue: RadioGroupContextValue;
  radioGroupProps: {
    'aria-disabled': boolean | undefined;
    role: 'radiogroup';
  };
  setValue: (value: string) => void;
  value: string | undefined;
};

export function useRadioGroup(
  options: UseRadioGroupOptions = {},
): UseRadioGroupReturn {
  const {
    defaultValue,
    disabled = false,
    name,
    onChange,
    value: controlledValue,
  } = options;

  const generatedName = useId();
  const resolvedName = name ?? generatedName;

  const [value, setValue] = useControllableState<string>({
    defaultValue,
    onChange,
    value: controlledValue,
  });

  return {
    contextValue: {
      disabled,
      name: resolvedName,
      setValue,
      value,
    },
    radioGroupProps: {
      'aria-disabled': disabled ? true : undefined,
      role: 'radiogroup',
    },
    setValue,
    value,
  };
}
