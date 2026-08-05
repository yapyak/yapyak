import type { ReactNode } from 'react';
import type { RefOrValue } from '#types';

import { PortalContext } from './portal-context';

export type PortalProviderProps = {
  children?: ReactNode;
  element: RefOrValue<HTMLDivElement | null>;
};

export function PortalProvider(props: PortalProviderProps) {
  const { children, element } = props;

  return (
    <PortalContext
      value={{
        element,
      }}
    >
      {children}
    </PortalContext>
  );
}
