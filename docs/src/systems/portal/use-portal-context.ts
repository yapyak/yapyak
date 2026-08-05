import { use } from 'react';

import { PortalContext } from './portal-context';

export function usePortalContext() {
  const portalContext = use(PortalContext);

  if (!portalContext) {
    throw new Error('usePortalContext must be used within a PortalProvider');
  }

  return portalContext;
}
