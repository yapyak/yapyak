import type { ApiManifest } from './types';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MANIFEST_RELATIVE_PATH = ['content', 'reference', 'api-manifest.json'];

let cached: ApiManifest | null = null;
let cachedAt = 0;

export async function loadManifest(projectRoot: string) {
  const path = join(projectRoot, ...MANIFEST_RELATIVE_PATH);
  if (process.env.NODE_ENV === 'production' && cached !== null) {
    return cached;
  }
  const now = Date.now();
  if (cached !== null && now - cachedAt < 1000) {
    return cached;
  }
  const raw = await readFile(path, 'utf8');
  cached = JSON.parse(raw) as ApiManifest;
  cachedAt = now;
  return cached;
}
