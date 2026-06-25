import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from 'yapyak';
import { resetLocale } from 'yapyak/internal';

import { middleware } from './middleware';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_USER_LOCALE: false,
  LOCALES: [
    'en',
    'sv',
  ],
  PERSISTENCE_CONFIG: {
    name: 'locale',
    type: 'cookie',
  },
  SYNC_HTML_LANG: false,
}));

describe('middleware', () => {
  afterEach(() => {
    resetLocale();
  });

  it('returns the response returned by `next`', async () => {
    const request = new Request('http://example.com/');
    const expected = new Response('body', {
      status: 200,
    });
    // biome-ignore lint/nursery/useAwaitThenable: yap yap yap
    const result = await middleware(
      {
        request,
      } as Parameters<typeof middleware>[0],
      async () => expected,
    );
    expect(result).toBe(expected);
  });

  it('drains Set-Cookie from a server-side `setLocale()` call onto the response', async () => {
    const request = new Request('http://example.com/');
    const response = new Response('body');
    // biome-ignore lint/nursery/useAwaitThenable: yap yap yap
    await middleware(
      {
        request,
      } as Parameters<typeof middleware>[0],
      async () => {
        setLocale('sv');
        return response;
      },
    );
    expect(response.headers.get('Set-Cookie')).toContain('locale=sv');
  });
});
