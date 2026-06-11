import type { NormalizedPersistenceConfig, Persistence } from './type';

import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { url } from './url';

export function buildPersistence(
  config: NormalizedPersistenceConfig,
  locales: string[],
): Persistence | undefined {
  if (config.type === 'none') {
    return undefined;
  }
  if (config.type === 'cookie') {
    return cookie({
      name: config.name,
      secure: config.secure,
    });
  }
  if (config.type === 'local-storage') {
    return localStorage({
      key: config.key,
    });
  }
  return url({
    locales,
    match: config.match,
  });
}
