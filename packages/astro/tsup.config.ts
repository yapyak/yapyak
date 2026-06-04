import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  entry: ['src/integration.ts', 'src/internal.ts', 'src/processor.ts'],
});
