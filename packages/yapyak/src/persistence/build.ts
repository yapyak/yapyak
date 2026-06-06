import type { NormalizedPersistenceConfig, Persistence } from './type';

import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { url } from './url';

export function buildPersistence(
  config: NormalizedPersistenceConfig,
  locales: string[],
): Persistence | null {
  if (config.type === 'none') {
    return null;
  }
  if (config.type === 'cookie') {
    return cookie({ name: config.name });
  }
  if (config.type === 'local-storage') {
    return localStorage({ key: config.key });
  }
  return url({ locales, match: config.match });
}
