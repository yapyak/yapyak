import { defineConfig } from 'vitest/config';

import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      'yapyak/runtime': resolve(
        import.meta.dirname,
        '../yapyak/src/runtime.ts',
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: [resolve(import.meta.dirname, '../../vitest.setup.ts')],
  },
});
