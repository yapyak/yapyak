import type { Manifest } from '../build/manifest.ts';
import type { Config } from '../config.ts';

import { buildManifest } from '../build/manifest.ts';

export async function extract(config: Config): Promise<Manifest> {
  return buildManifest(config);
}
