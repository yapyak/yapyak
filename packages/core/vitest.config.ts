import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@yapyak/runtime': new URL('./tests/runtime.ts', import.meta.url)
        .pathname,
    },
  },
});
