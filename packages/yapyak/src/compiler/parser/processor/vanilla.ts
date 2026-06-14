import type { Processor } from '../../../processor';

import { createProcessor } from '../../../processor';

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
