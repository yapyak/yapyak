import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  entry: ['src/index.ts', 'src/processor.ts'],
  external: ['vue', '@vue/compiler-core', '@vue/compiler-sfc'],
});
