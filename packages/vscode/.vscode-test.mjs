import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@vscode/test-cli';

const require = createRequire(import.meta.url);

export default defineConfig({
  files: 'e2e/*.spec.ts',
  version: '1.129.0',
  mocha: {
    require: require.resolve('tsx/cjs'),
    timeout: 30_000,
  },
  workspaceFolder: fileURLToPath(new URL('./e2e/fixture', import.meta.url)),
});
