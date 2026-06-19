import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { extractModule } from './module';
import type { PackageContext } from './package-context';
import { resetSourceFileCache } from './source-file';
import type { ReferenceManifest, ReferenceModule } from './type';

export type ExtractPackageInput = {
  context: PackageContext;
  packageDir: string;
  subpaths?: string[];
};

export function extractPackage(input: ExtractPackageInput): ReferenceManifest {
  resetSourceFileCache();
  const { context, packageDir, subpaths } = input;
  const modules: ReferenceModule[] = [];

  modules.push(
    extractModule({
      entryFile: resolveSourceEntry(packageDir, 'index'),
      moduleId: context.packageName,
      packageDir,
      subpath: '.',
    }),
  );

  for (const subpath of subpaths ?? []) {
    const name = subpath.replace(/^\.\//, '');
    modules.push(
      extractModule({
        entryFile: resolveSourceEntry(packageDir, name),
        moduleId: `${context.packageName}/${name}`,
        packageDir,
        subpath,
      }),
    );
  }

  return {
    modules,
    packageName: context.packageName,
  };
}

const SOURCE_CANDIDATES = [
  '.ts',
  '.tsx',
  '/index.ts',
  '/index.tsx',
];

function resolveSourceEntry(packageDir: string, name: string): string {
  const base = resolve(packageDir, 'src', name);
  for (const suffix of SOURCE_CANDIDATES) {
    const candidate = `${base}${suffix}`;
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`extractPackage: entry not found for src/${name}`);
}
