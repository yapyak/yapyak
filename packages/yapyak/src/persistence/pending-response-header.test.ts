import { describe, expect, it } from 'vitest';

import { writePendingResponseHeader } from './pending-response-header';
import { ensureSharedStorage } from './shared-storage';
import { AsyncLocalStorage } from 'node:async_hooks';

function buildStorage(): ReturnType<typeof ensureSharedStorage> {
  return ensureSharedStorage(() => ({
    headers: new AsyncLocalStorage<Headers>(),
    requests: new AsyncLocalStorage<Request>(),
  }));
}

describe('writePendingResponseHeader', () => {
  it('returns `true` and appends inside a request scope', () => {
    const storage = buildStorage();
    const responseHeaders = new Headers();
    let applied = false;
    storage.headers.run(responseHeaders, () => {
      applied = writePendingResponseHeader('Set-Cookie', 'locale=sv');
    });

    expect(applied).toBe(true);
    expect(responseHeaders.get('Set-Cookie')).toBe('locale=sv');
  });

  it('returns `false` outside a request scope', () => {
    buildStorage();

    expect(writePendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('appends repeated headers instead of replacing them', () => {
    const storage = buildStorage();
    const responseHeaders = new Headers();
    storage.headers.run(responseHeaders, () => {
      writePendingResponseHeader('Set-Cookie', 'locale=sv');
      writePendingResponseHeader('Set-Cookie', 'theme=dark');
    });

    expect(responseHeaders.getSetCookie()).toEqual([
      'locale=sv',
      'theme=dark',
    ]);
  });
});

describe('ensureSharedStorage', () => {
  it('returns the storage the first call created', () => {
    const first = buildStorage();
    const second = ensureSharedStorage(() => {
      throw new Error('unexpected create');
    });

    expect(second).toBe(first);
  });
});
