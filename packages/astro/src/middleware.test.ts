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
  SYNC_HTML_ATTRIBUTES: false,
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
    const result = await middleware(
      {
        request,
      } as Parameters<typeof middleware>[0],
      async () => expected,
    );
    expect(result).toBe(expected);
  });

  it('writes Set-Cookie onto the response when `setLocale()` is called server-side', async () => {
    const request = new Request('http://example.com/');
    const response = new Response('body');
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

  it('binds the locale to each request when invoked concurrently', async () => {
    const targets = Array.from(
      {
        length: 100,
      },
      (_, index) => (index % 2 === 0 ? 'en' : 'sv'),
    );
    const responses = await Promise.all(
      targets.map(async (target) => {
        const request = new Request('http://example.com/');
        const response = new Response('body');
        await middleware(
          {
            request,
          } as Parameters<typeof middleware>[0],
          async () => {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            setLocale(target);
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            return response;
          },
        );
        return response;
      }),
    );
    responses.forEach((response, index) => {
      expect(response.headers.get('Set-Cookie')).toContain(
        `locale=${targets[index]}`,
      );
    });
  });
});
