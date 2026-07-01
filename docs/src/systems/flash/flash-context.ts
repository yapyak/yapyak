import type { SwatchAccent } from '#components/swatch';

import { createContext, use } from 'react';

export type FlashEntry = {
  accent: SwatchAccent;
  id: number;
};

export type FlashTriggerOptions = {
  accent: SwatchAccent;
};

export type FlashContextValue = {
  entry: FlashEntry | null;
  trigger: (options: FlashTriggerOptions) => void;
};

export const FlashContext = createContext<FlashContextValue | null>(null);

export function useFlashContext() {
  const context = use(FlashContext);
  if (context === null) {
    throw new Error('useFlashContext must be used within a FlashProvider');
  }
  return context;
}
