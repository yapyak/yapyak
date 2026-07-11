import { describe, expect, it } from 'vitest';

import { appendPendingResponseHeader } from '../persistence';
import { createStorage } from './storage';
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

  it('writes the pending header when called inside a request scope', () => {
    const storage = createStorage();
    const responseHeaders = new Headers();
    let applied = false;
    storage.headers.run(responseHeaders, () => {
      applied = appendPendingResponseHeader('Set-Cookie', 'locale=sv');
    });

    expect(applied).toBe(true);
    expect(responseHeaders.get('Set-Cookie')).toBe('locale=sv');
  });

  it('writes no pending header when called outside a request scope', () => {
    createStorage();

    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });
});
