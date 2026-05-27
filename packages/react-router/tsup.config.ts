import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  entry: ['src/index.ts'],
  external: ['react-router'],
});
