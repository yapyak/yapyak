import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'virtual:yapyak': new URL(
        '../core/src/__test__/virtual-yapyak.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
