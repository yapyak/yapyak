import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/run.ts'],
  format: 'esm',
});
