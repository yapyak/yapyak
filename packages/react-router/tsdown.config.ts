import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'react-router',
    ],
  },
  entry: [
    'src/index.ts',
  ],
});
