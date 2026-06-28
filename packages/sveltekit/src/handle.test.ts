import type { ResolveOptions } from '@sveltejs/kit';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from 'yapyak';
import { resetLocale } from 'yapyak/internal';

import { handle } from './handle';

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

  it('binds the locale to each event when invoked concurrently', async () => {
    const targets = Array.from(
      {
        length: 100,
      },
      (_, index) => (index % 2 === 0 ? 'en' : 'sv'),
    );
    const responses = await Promise.all(
      targets.map(async (target) => {
        const event = makeEvent(new Request('http://example.com/'));
        return handle({
          event,
          resolve: async () => {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            setLocale(target);
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            return new Response('body');
          },
        } as Parameters<typeof handle>[0]);
      }),
    );
    responses.forEach((response, index) => {
      expect(response.headers.get('Set-Cookie')).toContain(
        `locale=${targets[index]}`,
      );
    });
  });
});
