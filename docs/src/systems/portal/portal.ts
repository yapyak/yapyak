import type { ReactNode } from 'react';

import { usePortal } from './use-portal';

export type PortalProps = {
  children: ReactNode;
};

export function Portal(props: PortalProps) {
  const { children } = props;

  const portal = usePortal();

  return portal(children);
}
