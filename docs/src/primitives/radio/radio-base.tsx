import type { ChangeEvent } from 'react';
import type { BoxProps } from '../box';

import { Box } from '../box';
import styles from './radio-base.module.css';
import { useRadioGroupContext } from './radio-group-context';

export type RadioBaseProps = Omit<BoxProps<'label'>, 'onChange'> & {
  disabled?: boolean;
  inputProps?: BoxProps<'input'>;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

export function RadioBase(props: RadioBaseProps) {
  const {
    children,
    disabled = false,
    inputProps,
    onChange,
    value,
    ...restProps
  } = props;

  const group = useRadioGroupContext();
  const isDisabled = disabled || group.disabled;
  const isChecked = group.value === value;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      group.setValue(value);
    }
    onChange?.(event);
  };

  return (
    <Box
      {...restProps}
      as="label"
      data-checked={isChecked}
      data-disabled={isDisabled}
    >
      {children}
      <Box
        {...inputProps}
        as="input"
        checked={isChecked}
        className={[
          styles.Input,
          inputProps?.className,
        ]}
        disabled={isDisabled}
        name={group.name}
        onChange={handleInputChange}
        type="radio"
        value={value}
      />
    </Box>
  );
}
