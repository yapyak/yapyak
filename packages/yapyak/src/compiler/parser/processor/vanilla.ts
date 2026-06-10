import type { Processor } from '../../../processor';

import { createProcessor } from '../../../processor';

export const vanillaProcessor: Processor = createProcessor(
  (magicString, source, importStatement) => {
    void source;
    magicString.prepend(`${importStatement}\n`);
  },
  [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mts',
    '.mjs',
    '.cts',
    '.cjs',
  ],
  'vanilla',
  (source) => [
    {
      code: source,
      kind: 'script',
      lang: 'ts',
      originalOffset: 0,
    },
  ],
);
