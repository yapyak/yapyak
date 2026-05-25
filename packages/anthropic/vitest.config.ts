import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@yapyak/runtime': new URL('../core/tests/runtime.ts', import.meta.url)
        .pathname,
    },
  },
});
