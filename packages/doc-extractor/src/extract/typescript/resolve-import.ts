import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CANDIDATE_SUFFIXES = [
  '.ts',
  '.tsx',
  '/index.ts',
  '/index.tsx',
];

export function resolveImport(
  fromFile: string,
  specifier: string,
): string | undefined {
  if (!specifier.startsWith('.')) {
    return undefined;
  }
  const base = resolve(dirname(fromFile), specifier);
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${base}${suffix}`;
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}
