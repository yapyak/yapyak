import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stage = join(root, 'vsix');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const files = [
  'dist',
  'LICENSE',
  'README.md',
  'icon.png',
  'package.nls.json',
];

delete manifest.devDependencies;
delete manifest.private;
delete manifest.scripts;
manifest.files = files;
manifest.name = 'yapyak';

rmSync(stage, {
  force: true,
  recursive: true,
});
mkdirSync(stage);
for (const file of files) {
  cpSync(join(root, file), join(stage, file), {
    recursive: true,
  });
}
writeFileSync(
  join(stage, 'package.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const repository = manifest.repository.url.replace(/\.git$/, '');
const directory = manifest.repository.directory;
execFileSync(
  join(root, 'node_modules', '.bin', 'vsce'),
  [
    'package',
    '--no-dependencies',
    '--baseContentUrl',
    `${repository}/blob/main/${directory}/`,
    '--baseImagesUrl',
    `${repository.replace('github.com', 'raw.githubusercontent.com')}/main/${directory}/`,
    '--out',
    join(root, `${manifest.name}-${manifest.version}.vsix`),
  ],
  {
    cwd: stage,
    stdio: 'inherit',
  },
);
