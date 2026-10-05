import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'react',
    ],
  },
  entry: [
    'src/index.ts',
    'src/compiler-runtime/internal.server.ts',
    'src/compiler-runtime/internal.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
});
