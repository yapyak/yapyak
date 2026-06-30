import type { AnimateState } from './animate-context';

import { use } from 'react';

import { AnimateContext } from './animate-context';

export function useAnimateContext(): AnimateState | null {
  return use(AnimateContext);
}
