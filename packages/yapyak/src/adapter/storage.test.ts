import { describe, expect, it } from 'vitest';

import { createStorage, getStorage } from './storage';
import { AsyncLocalStorage } from 'node:async_hooks';

describe('createStorage', () => {
  it('returns a storage with `requests` and `headers` async local stores', () => {
    const storage = createStorage();
    expect(storage.requests).toBeInstanceOf(AsyncLocalStorage);
    expect(storage.headers).toBeInstanceOf(AsyncLocalStorage);
  });

  it('returns the same instance on repeated calls', () => {
    expect(createStorage()).toBe(createStorage());
  });
});

describe('getStorage', () => {
  it('returns the storage created by `createStorage`', () => {
    const storage = createStorage();
    expect(getStorage()).toBe(storage);
  });
});
