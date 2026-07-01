import { use } from 'react';

import { StackContext } from './stack-context';

export function useStackContext() {
  const stackContext = use(StackContext);

  if (!stackContext) {
    throw new Error('useStackContext must be used within a StackProvider');
  }

  return stackContext;
}
