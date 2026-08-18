import { basename, dirname, extname, join } from 'node:path';

export function isLocaleFile(
  root: string,
  localesDir: string,
  path: string,
): boolean {
  return extname(path) === '.json' && dirname(path) === join(root, localesDir);
}

export function toLocaleCode(path: string): string {
  return basename(path, extname(path));
}
