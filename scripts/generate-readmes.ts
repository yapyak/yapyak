import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface PackageRecord {
  dir: string;
  docsSlug: string;
  name: string;
}

const PACKAGES: PackageRecord[] = [
  { dir: 'yapyak', docsSlug: 'yapyak', name: 'yapyak' },
  { dir: 'runtime', docsSlug: 'runtime', name: '@yapyak/runtime' },
  { dir: 'config', docsSlug: 'config', name: '@yapyak/config' },
  { dir: 'compiler', docsSlug: 'compiler', name: '@yapyak/compiler' },
  { dir: 'adapter', docsSlug: 'adapter', name: '@yapyak/adapter' },
  { dir: 'translator', docsSlug: 'translator', name: '@yapyak/translator' },
  { dir: 'vite', docsSlug: 'vite', name: '@yapyak/vite' },
  { dir: 'cli', docsSlug: 'cli', name: '@yapyak/cli' },
  { dir: 'react', docsSlug: 'react', name: '@yapyak/react' },
  { dir: 'vue', docsSlug: 'vue', name: '@yapyak/vue' },
  { dir: 'svelte', docsSlug: 'svelte', name: '@yapyak/svelte' },
  { dir: 'astro', docsSlug: 'astro', name: '@yapyak/astro' },
  {
    dir: 'tanstack-start',
    docsSlug: 'tanstack-start',
    name: '@yapyak/tanstack-start',
  },
  { dir: 'sveltekit', docsSlug: 'sveltekit', name: '@yapyak/sveltekit' },
  {
    dir: 'react-router',
    docsSlug: 'react-router',
    name: '@yapyak/react-router',
  },
  { dir: 'anthropic', docsSlug: 'anthropic', name: '@yapyak/anthropic' },
  { dir: 'openai', docsSlug: 'openai', name: '@yapyak/openai' },
  { dir: 'gemini', docsSlug: 'gemini', name: '@yapyak/gemini' },
  { dir: 'ollama', docsSlug: 'ollama', name: '@yapyak/ollama' },
];

const SUMMARY_RX = /^\s*\*\s+([A-Z][^\n]*?\.)\s*$/m;

function extractSummary(source: string): string | null {
  const match = SUMMARY_RX.exec(source);
  return match?.[1] ?? null;
}

function renderReadme(pkg: PackageRecord, summary: string): string {
  return [
    `# ${pkg.name}`,
    '',
    summary,
    '',
    '## Installation',
    '',
    '```bash',
    `npm install ${pkg.name}`,
    '# or',
    `pnpm add ${pkg.name}`,
    '```',
    '',
    '## Documentation',
    '',
    `[yapyak.dev/reference/${pkg.docsSlug}](https://yapyak.dev/reference/${pkg.docsSlug})`,
    '',
  ].join('\n');
}

const root = new URL('..', import.meta.url).pathname;
let generated = 0;
const skipped: string[] = [];

for (const pkg of PACKAGES) {
  const indexPath = join(root, 'packages', pkg.dir, 'src', 'index.ts');
  if (!existsSync(indexPath)) {
    skipped.push(`${pkg.name} (no src/index.ts)`);
    continue;
  }
  const source = readFileSync(indexPath, 'utf8');
  const summary = extractSummary(source);
  if (summary === null) {
    skipped.push(`${pkg.name} (no @packageDocumentation summary)`);
    continue;
  }
  const readme = renderReadme(pkg, summary);
  writeFileSync(join(root, 'packages', pkg.dir, 'README.md'), readme);
  generated += 1;
}

console.log(`Generated ${generated} README(s).`);
if (skipped.length > 0) {
  console.log(`Skipped: ${skipped.join(', ')}`);
}
