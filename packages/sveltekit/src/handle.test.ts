import type { ResolveOptions } from '@sveltejs/kit';

import { describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';
import { getPendingResponseHeaders } from 'yapyak/adapter';

import { handle } from './handle';

interface ResolveCall {
  options: ResolveOptions | undefined;
}

function makeEvent(request: Request): Parameters<typeof handle>[0]['event'] {
  return { request } as Parameters<typeof handle>[0]['event'];
}

describe('handle', () => {
  it('transforms `%yapyak.lang%` with the current locale in the page chunk', async () => {
    const calls: ResolveCall[] = [];
    const event = makeEvent(new Request('http://example.com/'));
    await handle({
      event,
      resolve: async (_event, options) => {
        calls.push({ options });
        const html = options?.transformPageChunk?.({
          done: true,
          html: '<html lang="%yapyak.lang%">',
        });
        return new Response(typeof html === 'string' ? html : '');
      },
    } as Parameters<typeof handle>[0]);
    expect(calls).toHaveLength(1);
    setLocale('en');
  });

  it('writes every pending yapyak header onto the response', async () => {
    const event = makeEvent(new Request('http://example.com/'));
    const response = new Response('body');
    await handle({
      event,
      resolve: async () => {
        getPendingResponseHeaders().append('Set-Cookie', 'lang=sv');
        return response;
      },
    } as Parameters<typeof handle>[0]);
    expect(response.headers.get('Set-Cookie')).toBe('lang=sv');
  });
});
