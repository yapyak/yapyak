import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  attw: {
    ignoreRules: [
      'internal-resolution-error',
    ],
    profile: 'esm-only',
  },
  deps: {
    neverBundle: [
      'svelte',
    ],
  },
  entry: [
    'src/processor.ts',
  ],
});
