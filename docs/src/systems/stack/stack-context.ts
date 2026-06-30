import type { Context } from 'react';

import { createContext } from 'react';

export type StackEntry = {
  id: string;
  lastFocusedElement: Element | null;
};

export type StackContextValue = {
  entries: StackEntry[];
  register: (id: string, lastFocusedElement: Element | null) => () => void;
};

export const StackContext: Context<null | StackContextValue> =
  createContext<null | StackContextValue>(null);
