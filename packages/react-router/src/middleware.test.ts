import { describe, expect, it } from 'vitest';
import { getPendingResponseHeaders } from 'yapyak/adapter';

import { middleware } from './middleware';

describe('middleware', () => {
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

  it('writes every pending yapyak header onto the response', async () => {
    const request = new Request('http://example.com/');
    const response = new Response('body');
    // biome-ignore lint/nursery/useAwaitThenable: yap yap yap
    await middleware(
      {
        request,
      } as Parameters<typeof middleware>[0],
      async () => {
        getPendingResponseHeaders().append('Set-Cookie', 'lang=sv');
        return response;
      },
    );
    expect(response.headers.get('Set-Cookie')).toBe('lang=sv');
  });
});
