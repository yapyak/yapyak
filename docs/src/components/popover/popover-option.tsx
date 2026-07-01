import type { ElementType } from 'react';
import type { BoxPropsWithAs } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './popover.module.css';

export type PopoverOptionProps<T extends ElementType = 'button'> =
  BoxPropsWithAs<T>;

export function PopoverOption<T extends ElementType = 'button'>(
  props: PopoverOptionProps<T>,
) {
  const { as, className, ...restProps } = props;
  const element = (as ?? 'button') as ElementType;

  return (
    <Box
      {...(restProps as BoxPropsWithAs<ElementType>)}
      as={element}
      className={[
        styles.Option,
        className,
      ]}
    />
  );
}
