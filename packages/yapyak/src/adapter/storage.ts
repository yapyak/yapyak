import type { SharedStorage } from '../persistence';

import { ensureSharedStorage, readSharedStorage } from '../persistence';
import { AsyncLocalStorage } from 'node:async_hooks';

export function createStorage(): SharedStorage {
  return ensureSharedStorage(() => ({
    headers: new AsyncLocalStorage<Headers>(),
    requests: new AsyncLocalStorage<Request>(),
  }));
}

export function readPendingResponseHeaders(): Headers | undefined {
  return readSharedStorage()?.headers.getStore();
}
