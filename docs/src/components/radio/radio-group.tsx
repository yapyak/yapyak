import type { ReactElement } from 'react';
import type { RadioGroupBaseProps } from '#primitives/radio';

import { RadioGroupBase } from '#primitives/radio';

import styles from './radio-group.module.css';

export type RadioGroupProps = RadioGroupBaseProps;

export function RadioGroup(props: RadioGroupProps): ReactElement {
  const { children, className, ...restProps } = props;

  return (
    <RadioGroupBase
      {...restProps}
      className={[
        styles.RadioGroup,
        className,
      ]}
    >
      {children}
    </RadioGroupBase>
  );
}
