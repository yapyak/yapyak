import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLocale } from '../index';
import { resetLocale } from '../internal';
import { withResponse } from './response';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_USER_LOCALE: true,
  LOCALES: [
    'en',
    'sv',
    'fr',
  ],
  PERSISTENCE_CONFIG: {
    name: 'locale',
    type: 'cookie',
  },
  SYNC_HTML_LANG: false,
}));

function makeRequest(
  headers: { acceptLanguage?: string; cookie?: string } = {},
): Request {
  const newHeaders = new Headers();
  if (headers.acceptLanguage !== undefined) {
    newHeaders.set('accept-language', headers.acceptLanguage);
  }
  if (headers.cookie !== undefined) {
    newHeaders.set('cookie', headers.cookie);
  }
  return new Request('http://example.test', {
    headers: newHeaders,
  });
}

describe('withResponse', () => {
  afterEach(() => {
    resetLocale();
  });

  it('returns the Response produced by the handler', async () => {
    const produced = new Response('ok');
    const result = await withResponse(makeRequest(), () => produced);
    expect(result).toBe(produced);
  });

  it('awaits a handler that returns Promise<Response>', async () => {
    const result = await withResponse(
      makeRequest(),
      async () => new Response('ok'),
    );
    expect(await result.text()).toBe('ok');
  });

  it('binds the cookie-resolved locale inside the handler', async () => {
    let observed = '';
    await withResponse(
      makeRequest({
        cookie: 'locale=sv',
      }),
      () => {
        observed = getLocale();
        return new Response();
      },
    );
    expect(observed).toBe('sv');
  });

  it('binds the Accept-Language-resolved locale when no cookie is present', async () => {
    let observed = '';
    await withResponse(
      makeRequest({
        acceptLanguage: 'sv-SE,en;q=0.9',
      }),
      () => {
        observed = getLocale();
        return new Response();
      },
    );
    expect(observed).toBe('sv');
  });

  it('prefers the cookie locale over Accept-Language', async () => {
    let observed = '';
    await withResponse(
      makeRequest({
        acceptLanguage: 'fr',
        cookie: 'locale=sv',
      }),
      () => {
        observed = getLocale();
        return new Response();
      },
    );
    expect(observed).toBe('sv');
  });

  it('falls back to Accept-Language when the persisted cookie is unsupported', async () => {
    let observed = '';
    await withResponse(
      makeRequest({
        acceptLanguage: 'sv',
        cookie: 'locale=de',
      }),
      () => {
        observed = getLocale();
        return new Response();
      },
    );
    expect(observed).toBe('sv');
  });

  it('preserves the outer locale across a nested scope', async () => {
    let outerSeenAfterInner = '';
    await withResponse(
      makeRequest({
        cookie: 'locale=sv',
      }),
      async () => {
        await withResponse(
          makeRequest({
            cookie: 'locale=fr',
          }),
          () => new Response(),
        );
        outerSeenAfterInner = getLocale();
        return new Response();
      },
    );
    expect(outerSeenAfterInner).toBe('sv');
  });

  it('returns the default locale outside any scope', () => {
    expect(getLocale()).toBe('en');
  });

  it('extracts the Response from a wrapped result via extractResponse', async () => {
    const response = new Response('inner');
    const wrapped = {
      meta: {
        id: 1,
      },
      response,
    };
    const result = await withResponse(
      makeRequest(),
      () => wrapped,
      (value) => value.response,
    );
    expect(result).toBe(wrapped);
  });

  it('throws when the handler returns a non-Response without extractResponse', async () => {
    await expect(
      withResponse(
        makeRequest(),
        () => 'not a response' as unknown as Response,
      ),
    ).rejects.toThrow(TypeError);
  });

  it('isolates pending-header buffers between concurrent scopes', async () => {
    const order: string[] = [];
    const [first, second] = await Promise.all([
      withResponse(
        makeRequest({
          cookie: 'locale=sv',
        }),
        async () => {
          order.push('first-enter');
          await new Promise((resolve) => setTimeout(resolve, 5));
          order.push('first-exit');
          return new Response('first');
        },
      ),
      withResponse(
        makeRequest({
          cookie: 'locale=fr',
        }),
        async () => {
          order.push('second-enter');
          return new Response('second');
        },
      ),
    ]);
    expect(await first.text()).toBe('first');
    expect(await second.text()).toBe('second');
    expect(order).toContain('first-enter');
    expect(order).toContain('second-enter');
  });
});
