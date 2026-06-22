import type { UserConfig } from 'tsdown';

import { promises as fs } from 'node:fs';
import path from 'node:path';

const INTERNAL_TAGS = [
  'shape',
  'kind',
];
const DTS_EXTENSIONS = [
  '.d.ts',
  '.d.mts',
  '.d.cts',
];

export function defineConfig(overrides: UserConfig): UserConfig {
  const userOnSuccess = overrides.onSuccess;

  return {
    clean: true,
    dts: true,
    fixedExtension: false,
    format: 'esm',
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    ...overrides,
    onSuccess: async (config, signal) => {
      const dtsFiles = await walkDtsFiles(path.resolve(config.outDir));
      await Promise.all(
        dtsFiles.map(async (file) => {
          const content = await fs.readFile(file, 'utf8');
          const stripped = stripInternalTags(content);
          if (stripped !== content) {
            await fs.writeFile(file, stripped);
          }
        }),
      );
      if (typeof userOnSuccess === 'function') {
        await Promise.resolve(userOnSuccess(config, signal));
      }
    },
  };
}

function stripInternalTags(content: string): string {
  let result = content;
  for (const tag of INTERNAL_TAGS) {
    result = result.replace(new RegExp(`\\{@${tag}\\b[^}]*\\}\\s?`, 'g'), '');
    result = result.replace(
      new RegExp(`^\\s*\\*\\s*@${tag}\\b.*(?:\\r?\\n|$)`, 'gm'),
      '',
    );
  }
  return result;
}

async function walkDtsFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {
    withFileTypes: true,
  });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkDtsFiles(fullPath);
      files.push(...nested);
      continue;
    }
    if (DTS_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}
