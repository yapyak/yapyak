import type { Config } from '../types/config.ts';
import type { Manifest } from '../types/manifest.ts';

import { buildManifest } from '../build/manifest.ts';

export async function extract(config: Config): Promise<Manifest> {
  return buildManifest(config);
}
