import type { Context } from 'react';

import { createContext } from 'react';

export type AnimateState = 'enter' | 'exit' | 'idle';

export const AnimateContext: Context<AnimateState | null> =
  createContext<AnimateState | null>(null);
