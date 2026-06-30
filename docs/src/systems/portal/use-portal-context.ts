import type { PortalContextValue } from './portal-context';

import { use } from 'react';

import { PortalContext } from './portal-context';

export function usePortalContext(): PortalContextValue {
  const portalContext = use(PortalContext);

  if (!portalContext) {
    throw new Error('usePortalContext must be used within a PortalProvider');
  }

  return portalContext;
}
