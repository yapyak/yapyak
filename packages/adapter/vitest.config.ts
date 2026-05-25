import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@yapyak/runtime': new URL(
        '../core/tests/virtual-yapyak.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
