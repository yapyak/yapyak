import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  dts: false,
  entry: ['src/run.ts'],
});
