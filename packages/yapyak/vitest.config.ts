import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@yapyak/shared': new URL('./fixture/runtime.ts', import.meta.url)
        .pathname,
    },
  },
});
