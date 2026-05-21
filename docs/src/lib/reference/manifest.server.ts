import type { ReferenceManifest } from './types';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MANIFEST_RELATIVE_PATH = ['content', 'reference', 'manifest.json'];

let cached: ReferenceManifest | null = null;

export async function loadManifest(projectRoot: string) {
  if (cached !== null) {
    return cached;
  }
  const path = join(projectRoot, ...MANIFEST_RELATIVE_PATH);
  const raw = await readFile(path, 'utf8');
  cached = JSON.parse(raw) as ReferenceManifest;
  return cached;
}

export function invalidateManifest() {
  cached = null;
}
