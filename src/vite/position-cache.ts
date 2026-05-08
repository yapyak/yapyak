import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { MessagePosition } from './detect-renames.js';

const CACHE_PATH = 'node_modules/.cache/yapyak/positions.json';

export type PositionCache = Record<string, MessagePosition[]>;

export function loadPositionCache(projectRoot: string): PositionCache {
  const path = join(projectRoot, CACHE_PATH);
  if (!existsSync(path)) {
    return {};
  }
  try {
    const raw = readFileSync(path, 'utf8');
    if (raw.trim() === '') {
      return {};
    }
    return JSON.parse(raw) as PositionCache;
  } catch {
    return {};
  }
}

export function savePositionCache(
  projectRoot: string,
  cache: PositionCache,
): void {
  const path = join(projectRoot, CACHE_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(cache, null, 2)}\n`);
}
