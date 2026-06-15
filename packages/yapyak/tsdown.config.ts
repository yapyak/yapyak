import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'yapyak/runtime',
    ],
  },
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/runtime.ts',
    'src/adapter/index.ts',
    'src/cli/bin.ts',
    'src/compiler/index.ts',
    'src/config/index.ts',
    'src/config/internal.ts',
    'src/processor/index.ts',
    'src/translator/index.ts',
    'src/translator/internal.ts',
  ],
});
