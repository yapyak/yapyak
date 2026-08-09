import type { LocaleFile } from '../compiler/catalog/locale/file';

import { readLocaleFile } from '../compiler/catalog/locale/file';
import { applyPatches } from '../hmr-patch';
import { buildPatches } from '../patch';
import { registerTracker } from '../tracker';
import { statSync } from 'node:fs';

type LocaleFileState = {
  locale: string;
  mtimeMs: number;
  previous: LocaleFile;
  size: number;
};

const stateByPath = new Map<string, LocaleFileState>();
let isTrackerRegistered = false;

export function registerLocaleFileSource(
  filesByLocale: Record<string, string>,
): void {
  for (const [locale, path] of Object.entries(filesByLocale)) {
    if (!stateByPath.has(path)) {
      stateByPath.set(path, {
        locale,
        mtimeMs: -1,
        previous: {},
        size: -1,
      });
    }
  }
  if (!isTrackerRegistered) {
    isTrackerRegistered = true;
    registerTracker(refreshFromLocaleFiles);
  }
}

function refreshFromLocaleFiles(): void {
  for (const [path, state] of stateByPath) {
    let mtimeMs: number;
    let size: number;
    try {
      ({ mtimeMs, size } = statSync(path));
    } catch {
      continue;
    }
    if (mtimeMs === state.mtimeMs && size === state.size) {
      continue;
    }
    let next: LocaleFile;
    try {
      next = readLocaleFile(path);
    } catch {
      continue;
    }
    const patches = buildPatches(state.previous, next, state.locale);
    state.mtimeMs = mtimeMs;
    state.previous = next;
    state.size = size;
    if (patches.length > 0) {
      applyPatches({
        patches,
      });
    }
  }
}
