import type { ReactNode } from 'react';
import type { BoxProps } from '../box';

import { Box } from '../box';
import { useListboxContext } from './listbox-context';

export type ListboxOptionState = {
  highlighted: boolean;
  selected: boolean;
};

export type ListboxBaseOptionProps = Omit<BoxProps, 'children'> & {
  children?: ((state: ListboxOptionState) => ReactNode) | ReactNode;
  disabled?: boolean;
  value: string;
};

export function ListboxBaseOption(props: ListboxBaseOptionProps) {
  const { children, disabled = false, value, ...restProps } = props;

  const context = useListboxContext();
  const isHighlighted = context.highlightedValue === value;
  const isSelected = context.selectedValue === value;

  return (
    <Box
      {...restProps}
      aria-disabled={disabled ? true : undefined}
      aria-selected={isSelected}
      data-highlighted={isHighlighted}
      data-value={value}
      id={context.getOptionId(value)}
      role="option"
    >
      {typeof children === 'function'
        ? children({
            highlighted: isHighlighted,
            selected: isSelected,
          })
        : children}
    </Box>
  );
}
