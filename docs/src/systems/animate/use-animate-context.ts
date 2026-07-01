import { use } from 'react';

import { AnimateContext } from './animate-context';

export function useAnimateContext() {
  return use(AnimateContext);
}
