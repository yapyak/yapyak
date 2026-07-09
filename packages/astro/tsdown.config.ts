import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  attw: {
    ignoreRules: [
      'internal-resolution-error',
    ],
    profile: 'esm-only',
  },
  entry: [
    'src/integration.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
});
