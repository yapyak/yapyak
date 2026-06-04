import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  entry: ['src/processor.ts'],
  external: ['svelte'],
});
