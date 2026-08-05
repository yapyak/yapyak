import type { State } from './state';

import { getNormalized } from './state';
import { extname, join, relative, sep } from 'node:path';

export function isLocaleFile(state: State, path: string): boolean {
  const directory = join(state.projectRoot, getNormalized(state).localesDir);
  const relativePath = relative(directory, path);
  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    relativePath.includes(sep)
  ) {
    return false;
  }
  return extname(relativePath) === '.json';
}
