import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/run.ts'],
  external: ['vite'],
  format: 'esm',
});
