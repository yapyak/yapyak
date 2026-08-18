import { basename, dirname, extname, resolve } from 'node:path';

export function isLocaleFile(
  root: string,
  localesDir: string,
  path: string,
): boolean {
  return (
    extname(path) === '.json' &&
    resolve(dirname(path)) === resolve(root, localesDir)
  );
}

export function toLocaleCode(path: string): string {
  return basename(path, extname(path));
}
