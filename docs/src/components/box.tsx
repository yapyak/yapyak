import type {
  ComponentProps,
  ComponentRef,
  ElementType,
  ReactElement,
  Ref,
} from 'react';
import type { ClassName, ComposableRef, Style } from '#types';

import { mergeClassNames } from '#utils/merge-class-names';
import { mergeRefs } from '#utils/merge-refs';
import { mergeStyles } from '#utils/merge-styles';
import { normalizeProps } from '#utils/normalize-props';

export type BoxProps<T extends ElementType = 'div'> = Omit<
  ComponentProps<T>,
  'className' | 'ref' | 'style'
> & {
  className?: ClassName;
  ref?: ComposableRef<ComponentRef<T>>;
  style?: Style;
};

export type BoxPropsWithAs<T extends ElementType> = {
  as?: T;
} & BoxProps<T>;

export function Box<T extends ElementType = 'div'>(
  props: BoxPropsWithAs<T>,
): ReactElement {
  const { as: Element = 'div', className, ref, style, ...restProps } = props;

  return (
    <Element
      {...normalizeProps(restProps)}
      className={mergeClassNames(className)}
      ref={mergeRefs(ref) as Ref<HTMLDivElement>}
      style={mergeStyles(style)}
    />
  );
}
