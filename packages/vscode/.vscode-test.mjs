import { cpSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@vscode/test-cli';

const require = createRequire(import.meta.url);

const onePackageRoot = join(tmpdir(), 'yapyak-vscode-one-package');
rmSync(onePackageRoot, {
  force: true,
  recursive: true,
});
cpSync(fileURLToPath(new URL('./e2e/one-package/fixture', import.meta.url)), onePackageRoot, {
  recursive: true,
});
mkdirSync(join(onePackageRoot, 'node_modules', '@yapyak'), {
  recursive: true,
});
symlinkSync(
  fileURLToPath(new URL('../react', import.meta.url)),
  join(onePackageRoot, 'node_modules', '@yapyak', 'react'),
);

const shared = {
  version: '1.129.0',
  mocha: {
    require: require.resolve('tsx/cjs'),
    timeout: 30_000,
  },
};

export default defineConfig([
  {
    ...shared,
    files: 'e2e/*.spec.ts',
    label: 'fixture',
    workspaceFolder: fileURLToPath(new URL('./e2e/fixture', import.meta.url)),
  },
  {
    ...shared,
    files: 'e2e/one-package/*.spec.ts',
    label: 'one-package',
    workspaceFolder: onePackageRoot,
  },
]);
