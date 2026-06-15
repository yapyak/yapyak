import type { ResolveOptions } from '@sveltejs/kit';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from 'yapyak';
import { resetLocale } from 'yapyak/internal';

import { handle } from './handle';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
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

type ResolveCall = {
  options: ResolveOptions | undefined;
};

function makeEvent(request: Request): Parameters<typeof handle>[0]['event'] {
  return {
    request,
  } as Parameters<typeof handle>[0]['event'];
}

describe('handle', () => {
  afterEach(() => {
    resetLocale();
  });

  it('transforms `%yapyak.lang%` with the current locale in the page chunk', async () => {
    const calls: ResolveCall[] = [];
    const event = makeEvent(new Request('http://example.com/'));
    await handle({
      event,
      resolve: async (_event, options) => {
        calls.push({
          options,
        });
        const html = options?.transformPageChunk?.({
          done: true,
          html: '<html lang="%yapyak.lang%">',
        });
        return new Response(typeof html === 'string' ? html : '');
      },
    } as Parameters<typeof handle>[0]);
    expect(calls).toHaveLength(1);
  });

  it('drains Set-Cookie from a server-side `setLocale()` call onto the response', async () => {
    const event = makeEvent(new Request('http://example.com/'));
    const response = await handle({
      event,
      resolve: async () => {
        setLocale('sv');
        return new Response('body');
      },
    } as Parameters<typeof handle>[0]);
    expect(response.headers.get('Set-Cookie')).toContain('locale=sv');
  });
});
