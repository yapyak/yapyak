import type { NormalizedPersistence } from '@yapyak/runtime';
import type { Persistence } from './create';

import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { url } from './url';

export function buildPersistence(
  config: NormalizedPersistence,
  locales: readonly string[],
): Persistence | null {
  if (config === null) {
    return null;
  }
  if (config.type === 'cookie') {
    return cookie({ name: config.name });
  }
  if (config.type === 'localStorage') {
    return localStorage({ key: config.key });
  }
  return url({ locales, match: config.match });
}
