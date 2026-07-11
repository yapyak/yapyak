import type { Processor } from './type';

import { createProcessor } from './create';

export const vanillaProcessor: Processor = createProcessor({
  extensions: [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mts',
    '.mjs',
    '.cts',
    '.cjs',
  ],
  id: 'vanilla',
});
