import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'virtual:yapyak': new URL(
        '../core/tests/virtual-yapyak.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
