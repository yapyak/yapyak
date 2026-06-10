import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetResponseHeaderWriter,
  setResponseHeaderWriter,
} from '../locale/response-header-writer';
import { resetWarn, setWarn } from '../warn';
import { cookie, parseCookie } from './cookie';

describe('cookie', () => {
  describe('in browser', () => {
    let cookieJar = '';

    beforeEach(() => {
      cookieJar = '';
      vi.stubGlobal('document', {
        get cookie() {
          return cookieJar;
        },
        set cookie(value: string) {
          const [pair] = value.split(';');
          if (!pair) {
            return;
          }
          const [name, val = ''] = pair.split('=');
          const trimmedName = name?.trim();
          if (!trimmedName) {
            return;
          }
          const existing = cookieJar
            .split(';')
            .map((part) => part.trim())
            .filter((part) => part && !part.startsWith(`${trimmedName}=`));
          existing.push(`${trimmedName}=${val.trim()}`);
          cookieJar = existing.join('; ');
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns the cookie value from `document.cookie`', () => {
      cookieJar = 'locale=sv';
      expect(
        cookie({
          name: 'locale',
        }).get(),
      ).toBe('sv');
    });

    it('writes to `document.cookie` on set', () => {
      cookie({
        name: 'locale',
      }).set('fr');
      expect(cookieJar).toContain('locale=fr');
    });

    it('writes under the configured cookie name', () => {
      cookie({
        name: 'app-locale',
      }).set('de');
      expect(cookieJar).toContain('app-locale=de');
    });

    it('returns true from set in the browser', () => {
      expect(
        cookie({
          name: 'locale',
        }).set('sv'),
      ).toBe(true);
    });

    it('returns the cookie value from the request `cookie` header', () => {
      const request = new Request('http://example.test', {
        headers: {
          cookie: 'locale=sv; theme=dark',
        },
      });
      expect(
        cookie({
          name: 'locale',
        }).getFromRequest?.(request),
      ).toBe('sv');
    });

    it('returns `undefined` when cookie is missing', () => {
      cookieJar = 'theme=dark';
      expect(
        cookie({
          name: 'locale',
        }).get(),
      ).toBeUndefined();
    });

    it('returns `undefined` when cookie is an empty string', () => {
      cookieJar = 'locale=';
      expect(
        cookie({
          name: 'locale',
        }).get(),
      ).toBeUndefined();
    });

    it('returns `undefined` from `getFromRequest` when `cookie` header is missing', () => {
      const request = new Request('http://example.test');
      expect(
        cookie({
          name: 'locale',
        }).getFromRequest?.(request),
      ).toBeUndefined();
    });
  });

  describe('in non-browser environment', () => {
    let writes: [
      string,
      string,
    ][] = [];

    beforeEach(() => {
      writes = [];
    });

    afterEach(() => {
      resetResponseHeaderWriter();
      resetWarn();
    });

    it('returns `undefined` from `get` when `document` is missing', () => {
      expect(
        cookie({
          name: 'locale',
        }).get(),
      ).toBeUndefined();
    });

    it('writes `Set-Cookie` via the registered writer', () => {
      setResponseHeaderWriter((name, value) =>
        writes.push([
          name,
          value,
        ]),
      );
      cookie({
        name: 'locale',
      }).set('sv');
      expect(writes).toEqual([
        [
          'Set-Cookie',
          'locale=sv; path=/; max-age=31536000; samesite=lax',
        ],
      ]);
    });

    it('transforms the locale value when writing the cookie string', () => {
      setResponseHeaderWriter((name, value) =>
        writes.push([
          name,
          value,
        ]),
      );
      cookie({
        name: 'locale',
      }).set('en-US');
      expect(writes[0]?.[1]).toContain('locale=en-US');
    });

    it('holds the configured cookie name in the writer call', () => {
      setResponseHeaderWriter((name, value) =>
        writes.push([
          name,
          value,
        ]),
      );
      cookie({
        name: 'app-locale',
      }).set('de');
      expect(writes[0]?.[1]).toContain('app-locale=de');
    });

    it('returns false from set when a writer is registered', () => {
      setResponseHeaderWriter((name, value) =>
        writes.push([
          name,
          value,
        ]),
      );
      expect(
        cookie({
          name: 'locale',
        }).set('sv'),
      ).toBe(false);
    });

    it('returns false from set when no writer is registered', () => {
      setWarn(vi.fn());
      expect(
        cookie({
          name: 'locale',
        }).set('sv'),
      ).toBe(false);
    });

    it('warns when set is called without a writer', () => {
      const stub = vi.fn();
      setWarn(stub);

      cookie({
        name: 'locale',
      }).set('sv');

      expect(stub).toHaveBeenCalledWith(
        expect.stringContaining(
          'setLocale() called server-side outside a withRequest scope',
        ),
        expect.objectContaining({
          code: 'YPK_PERSISTENCE_COOKIE_NO_WRITER',
        }),
      );
    });
  });

  describe('subscribe', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('blocks subscription in a non-browser environment', () => {
      const onChange = vi.fn();
      cookie({
        name: 'locale',
      }).subscribe?.(onChange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('notifies the callback on a Cookie Store change', () => {
      const cookieStore = new EventTarget();
      vi.stubGlobal('window', {
        cookieStore,
      });
      const onChange = vi.fn();
      cookie({
        name: 'locale',
      }).subscribe?.(onChange);
      cookieStore.dispatchEvent(new Event('change'));
      expect(onChange).toHaveBeenCalledOnce();
    });

    it('blocks invoking the callback after unsubscribe', () => {
      const cookieStore = new EventTarget();
      vi.stubGlobal('window', {
        cookieStore,
      });
      const onChange = vi.fn();
      const unsubscribe = cookie({
        name: 'locale',
      }).subscribe?.(onChange);
      unsubscribe?.();
      cookieStore.dispatchEvent(new Event('change'));
      expect(onChange).not.toHaveBeenCalled();
    });

    describe('without the Cookie Store API', () => {
      let documentListeners: Map<string, Array<(event: Event) => void>>;
      let visibilityState: DocumentVisibilityState;
      let history: {
        pushState: (state: unknown, title: string, url: string) => void;
        replaceState: (state: unknown, title: string, url: string) => void;
      };

      beforeEach(() => {
        vi.useFakeTimers();
        visibilityState = 'visible';
        documentListeners = new Map();
        history = {
          pushState() {},
          replaceState() {},
        };
        vi.stubGlobal('window', {
          addEventListener() {},
          clearInterval(id?: number) {
            globalThis.clearInterval(id);
          },
          history,
          setInterval(handler: () => void, ms?: number) {
            return globalThis.setInterval(handler, ms);
          },
        });
        vi.stubGlobal('document', {
          addEventListener(type: string, fn: (event: Event) => void) {
            const arr = documentListeners.get(type) ?? [];
            arr.push(fn);
            documentListeners.set(type, arr);
          },
          get visibilityState() {
            return visibilityState;
          },
        });
      });

      function dispatchDocument(type: string): void {
        for (const fn of documentListeners.get(type) ?? []) {
          fn(new Event(type));
        }
      }

      it('notifies the callback on a history navigation', () => {
        const onChange = vi.fn();
        cookie({
          name: 'locale',
        }).subscribe?.(onChange);
        history.pushState({}, '', '/');
        expect(onChange).toHaveBeenCalledOnce();
      });

      it('notifies the callback while polling when visible', () => {
        const onChange = vi.fn();
        cookie({
          name: 'locale',
        }).subscribe?.(onChange);
        vi.advanceTimersByTime(1000);
        expect(onChange).toHaveBeenCalled();
      });

      it('blocks polling when hidden and resumes when visible again', () => {
        const onChange = vi.fn();
        cookie({
          name: 'locale',
        }).subscribe?.(onChange);
        visibilityState = 'hidden';
        dispatchDocument('visibilitychange');
        vi.advanceTimersByTime(5000);
        expect(onChange).not.toHaveBeenCalled();
        visibilityState = 'visible';
        dispatchDocument('visibilitychange');
        expect(onChange).toHaveBeenCalledOnce();
      });
    });
  });
});

describe('parseCookie', () => {
  it('parses a single cookie', () => {
    expect(parseCookie('locale=sv')).toEqual({
      locale: 'sv',
    });
  });

  it('parses multiple cookies', () => {
    expect(parseCookie('locale=sv; theme=dark')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('transforms whitespace around names and values', () => {
    expect(parseCookie('  locale  =  sv  ;  theme  =  dark  ')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('transforms URI-encoded values', () => {
    expect(parseCookie('greeting=Hej%20v%C3%A4rlden')).toEqual({
      greeting: 'Hej världen',
    });
  });

  it('clears surrounding double quotes from values', () => {
    expect(parseCookie('locale="sv"')).toEqual({
      locale: 'sv',
    });
  });

  it('returns the raw value when decode fails', () => {
    expect(parseCookie('broken=%E0%A4%A')).toEqual({
      broken: '%E0%A4%A',
    });
  });

  it('returns an empty object for an empty header', () => {
    expect(parseCookie('')).toEqual({});
  });

  it('blocks segments without an equals sign', () => {
    expect(parseCookie('locale=sv; broken; theme=dark')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('blocks segments with an empty name', () => {
    expect(parseCookie('=orphan; locale=sv')).toEqual({
      locale: 'sv',
    });
  });

  it('preserves equals signs inside values', () => {
    expect(parseCookie('token=abc=def=ghi')).toEqual({
      token: 'abc=def=ghi',
    });
  });
});
