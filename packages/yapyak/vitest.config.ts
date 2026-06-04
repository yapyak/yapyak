import { defineConfig } from 'vitest/config';

import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      'yapyak/runtime': resolve(import.meta.dirname, 'src/runtime.ts'),
    },
  },
});
