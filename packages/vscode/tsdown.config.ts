import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  attw: false,
  deps: {
    neverBundle: [
      'vscode',
    ],
  },
  dts: false,
  entry: [
    'src/index.ts',
  ],
  fixedExtension: true,
  publint: false,
});
