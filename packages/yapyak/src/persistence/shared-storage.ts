import type { AsyncLocalStorage } from 'node:async_hooks';

const STORAGE_KEY = Symbol.for('yapyak.adapter.storage');

export type SharedStorage = {
  headers: AsyncLocalStorage<Headers>;
  requests: AsyncLocalStorage<Request>;
};

type StorageCarrier = {
  [STORAGE_KEY]?: SharedStorage;
};

export function readSharedStorage(): SharedStorage | undefined {
  return (globalThis as StorageCarrier)[STORAGE_KEY];
}

export function ensureSharedStorage(
  create: () => SharedStorage,
): SharedStorage {
  const carrier = globalThis as StorageCarrier;
  carrier[STORAGE_KEY] ??= create();
  return carrier[STORAGE_KEY];
}
