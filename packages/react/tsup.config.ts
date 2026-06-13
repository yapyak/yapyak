import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/processor.ts',
  ],
  external: [
    'react',
  ],
});
