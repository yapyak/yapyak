import type { Context } from 'react';
import type { Locale } from 'yapyak';

import { createContext } from 'react';

export const LocaleContext: Context<Locale | undefined> = createContext<
  Locale | undefined
>(undefined);

export const DevVersionContext: Context<number> = createContext(0);
