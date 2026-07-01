import type { ComponentProps, ReactElement } from 'react';
import type { ClassName } from '#types';

import { Link } from '@tanstack/react-router';

import { mergeClassNames } from '#utils/merge-class-names';
import { normalizeProps } from '#utils/normalize-props';

export type LinkBaseProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  className?: ClassName;
};

export function LinkBase(props: LinkBaseProps): ReactElement {
  const { className, ...restProps } = props;

  return (
    <Link
      {...normalizeProps(restProps)}
      className={mergeClassNames(className)}
    />
  );
}
