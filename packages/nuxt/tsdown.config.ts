import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'nuxt/app',
      'nitropack/runtime',
      'yapyak/runtime',
    ],
  },
  entry: [
    'src/index.ts',
    'src/bin.ts',
    'src/processor.ts',
    'src/runtime/nitro.ts',
    'src/runtime/plugin.ts',
  ],
});
