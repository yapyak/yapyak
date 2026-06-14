import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  entry: [
    'src/integration.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
});
