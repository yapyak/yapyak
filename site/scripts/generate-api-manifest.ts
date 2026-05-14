import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { extractApi } from '../src/docs/extract-api.ts';

const yapyakDir = resolve(import.meta.dirname, '..', '..');
const outFile = resolve(
  import.meta.dirname,
  '..',
  'content',
  'reference',
  'api-manifest.json',
);

const manifest = await extractApi(yapyakDir);
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote ${outFile}\n`);
process.stdout.write(`Modules: ${manifest.modules.length}\n`);
process.stdout.write(
  `Exports: ${manifest.modules.reduce((n, m) => n + m.exports.length, 0)}\n`,
);
