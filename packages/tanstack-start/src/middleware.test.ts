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

type MiddlewareContext = {
  next: () => Promise<{
    response: Response;
  }>;
  request: Request;
};

function getServer(): (context: MiddlewareContext) => Promise<{
  response: Response;
}> {
  const def = middleware as unknown as {
    options?: {
      server?: (context: MiddlewareContext) => Promise<{
        response: Response;
      }>;
    };
  };
  if (!def.options?.server) {
    throw new Error('server handler missing from middleware');
  }
  return def.options.server;
}

describe('middleware', () => {
  afterEach(() => {
    resetLocale();
  });

  it('returns the result returned by `next`', async () => {
    const server = getServer();
    const request = new Request('http://example.com/');
    const expected = {
      response: new Response('body'),
    };
    const result = await server({
      next: async () => expected,
      request,
    });
    expect(result).toBe(expected);
  });

  it('drains Set-Cookie from a server-side `setLocale()` call onto the wrapped response', async () => {
    const server = getServer();
    const request = new Request('http://example.com/');
    const response = new Response('body');
    await server({
      next: async () => {
        setLocale('sv');
        return {
          response,
        };
      },
      request,
    });
    expect(response.headers.get('Set-Cookie')).toContain('locale=sv');
  });

  it('binds the locale to each request when invoked concurrently', async () => {
    const server = getServer();
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
        await server({
          next: async () => {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            setLocale(target);
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            return {
              response,
            };
          },
          request,
        });
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
