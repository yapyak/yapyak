import type { Context } from 'react';
import type { RefOrValue } from '#types';

import { createContext } from 'react';

export type PortalContextValue = {
  element: RefOrValue<HTMLDivElement | null>;
};

export const PortalContext: Context<null | PortalContextValue> =
  createContext<null | PortalContextValue>(null);
