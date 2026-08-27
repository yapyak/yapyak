import type { NitroApp } from 'nitropack/types';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from 'yapyak';
import { resetLocale } from 'yapyak/internal';

import nitro from './nitro';

vi.mock('nitropack/runtime', () => ({
  defineNitroPlugin: (plugin: unknown) => plugin,
}));

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

type FakeEvent = {
  event: Parameters<NitroApp['h3App']['handler']>[0];
  headers: Map<string, string>;
  writeHead: ReturnType<typeof vi.fn>;
};

function makeEvent(): FakeEvent {
  const headers = new Map<string, string>();
  const writeHead = vi.fn();
  const res = {
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    headersSent: false,
    setHeader: (name: string, value: string) => {
      headers.set(name.toLowerCase(), value);
    },
    writeHead,
  };
  const event = {
    headers: new Headers(),
    node: {
      req: {
        headers: {
          host: 'example.com',
        },
        url: '/',
      },
      res,
    },
    path: '/',
  } as unknown as Parameters<NitroApp['h3App']['handler']>[0];
  return {
    event,
    headers,
    writeHead,
  };
}

function makeNitroApp(
  handler: (event: Parameters<NitroApp['h3App']['handler']>[0]) => unknown,
): NitroApp {
  return {
    h3App: {
      handler,
    },
    hooks: {
      hook: vi.fn(),
    },
  } as unknown as NitroApp;
}

async function invoke(
  nitroApp: NitroApp,
  event: FakeEvent['event'],
): Promise<void> {
  const handler = nitroApp.h3App.handler as (
    handledEvent: FakeEvent['event'],
  ) => Promise<unknown>;
  await handler(event);
}

describe('nitro', () => {
  afterEach(() => {
    resetLocale();
  });

  it('writes Set-Cookie before the headers when `setLocale()` runs in a route', async () => {
    const { event, headers, writeHead } = makeEvent();
    const nitroApp = makeNitroApp((routeEvent) => {
      setLocale('sv');
      routeEvent.node.res.writeHead(303);
      return null;
    });
    nitro(nitroApp);

    await invoke(nitroApp, event);

    expect(headers.get('set-cookie')).toContain('locale=sv');
    expect(writeHead).toHaveBeenCalledWith(303);
  });

  it('flushes the pending headers when the response is written after the handler', async () => {
    const { event, headers } = makeEvent();
    const nitroApp = makeNitroApp(() => {
      setLocale('sv');
      return null;
    });
    nitro(nitroApp);

    await invoke(nitroApp, event);
    event.node.res.writeHead(200);

    expect(headers.get('set-cookie')).toContain('locale=sv');
  });

  it('skips the flush when the headers are already sent', async () => {
    const { event, headers } = makeEvent();
    const nitroApp = makeNitroApp(() => {
      setLocale('sv');
      return null;
    });
    nitro(nitroApp);

    await invoke(nitroApp, event);
    (
      event.node.res as {
        headersSent: boolean;
      }
    ).headersSent = true;
    event.node.res.writeHead(200);

    expect(headers.get('set-cookie')).toBeUndefined();
  });

  it('isolates the locale per request when invoked concurrently', async () => {
    const targets = [
      'en',
      'sv',
      'en',
      'sv',
    ];
    const results = await Promise.all(
      targets.map(async (target) => {
        const { event, headers } = makeEvent();
        const nitroApp = makeNitroApp(async () => {
          await new Promise((resolve) => setTimeout(resolve, 2));
          setLocale(target);
          return null;
        });
        nitro(nitroApp);
        await invoke(nitroApp, event);
        event.node.res.writeHead(200);
        return headers.get('set-cookie');
      }),
    );

    results.forEach((cookie, index) => {
      expect(cookie).toContain(`locale=${targets[index]}`);
    });
  });
});
