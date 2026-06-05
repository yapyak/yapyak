import type { Manifest } from '../build/manifest';
import type { Config } from '../config';

import { buildManifest } from '../build/manifest';

export async function extract(config: Config): Promise<Manifest> {
  return buildManifest(config);
}
