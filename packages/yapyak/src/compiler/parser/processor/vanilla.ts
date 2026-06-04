import type { Processor } from '../../../processor';

import { createProcessor } from '../../../processor';

export const vanillaProcessor: Processor = createProcessor({
  applyImport(magicString, source, importStatement) {
    void source;
    magicString.prepend(`${importStatement}\n`);
  },
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs'],
  id: 'vanilla',
  parseFragments(source) {
    return [
      {
        code: source,
        kind: 'script',
        lang: 'ts',
        originalOffset: 0,
      },
    ];
  },
});
