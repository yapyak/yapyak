import type { ComponentProps, ReactElement } from 'react';

import { Link } from '@tanstack/react-router';

export type LinkBaseProps = ComponentProps<typeof Link>;

export function LinkBase(props: LinkBaseProps): ReactElement {
  return <Link {...props} />;
}
