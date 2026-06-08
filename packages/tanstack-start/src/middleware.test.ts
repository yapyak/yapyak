import { describe, expect, it } from 'vitest';
import { getPendingResponseHeaders } from 'yapyak/adapter';

import { middleware } from './middleware';

interface MiddlewareContext {
  next: () => Promise<{ response: Response }>;
  request: Request;
}

function getServer(): (
  context: MiddlewareContext,
) => Promise<{ response: Response }> {
  const def = middleware as unknown as {
    options?: {
      server?: (context: MiddlewareContext) => Promise<{ response: Response }>;
    };
  };
  if (!def.options?.server) {
    throw new Error('server handler missing from middleware');
  }
  return def.options.server;
}

describe('middleware', () => {
  it('returns the result returned by `next`', async () => {
    const server = getServer();
    const request = new Request('http://example.com/');
    const expected = { response: new Response('body') };
    const result = await server({ next: async () => expected, request });
    expect(result).toBe(expected);
  });

  it('appends every pending yapyak header onto the response', async () => {
    const server = getServer();
    const request = new Request('http://example.com/');
    const response = new Response('body');
    await server({
      next: async () => {
        getPendingResponseHeaders().append('Set-Cookie', 'lang=sv');
        return { response };
      },
      request,
    });
    expect(response.headers.get('Set-Cookie')).toBe('lang=sv');
  });
});
