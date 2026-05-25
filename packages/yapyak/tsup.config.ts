import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/internal.ts'],
  external: ['@yapyak/runtime'],
  format: 'esm',
});
