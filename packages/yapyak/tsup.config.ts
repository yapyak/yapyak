import { defineConfig } from '@yapyak/tsup-config';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/runtime.ts',
    'src/adapter/index.ts',
    'src/cli/run.ts',
    'src/compiler/index.ts',
    'src/config/index.ts',
    'src/config/internal.ts',
    'src/processor/index.ts',
    'src/translator/index.ts',
    'src/translator/internal.ts',
  ],
  external: [
    'yapyak/runtime',
  ],
});
