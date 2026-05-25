import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@yapyak/runtime': new URL(
        '../core/src/__test__/virtual-yapyak.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
