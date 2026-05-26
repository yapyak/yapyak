import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { type: 'url' },
  SYNC_HTML_LANG: false,
}));

interface MockWindow {
  addEventListener: (type: string, fn: (event: Event) => void) => void;
  dispatchEvent: (event: Event) => void;
  history: {
    pushState: (state: unknown, title: string, url: string) => void;
    replaceState: (state: unknown, title: string, url: string) => void;
  };
  location: { pathname: string };
}

let mockWindow: MockWindow;
let listeners: Map<string, Array<(event: Event) => void>>;
let pathname = '/en/home';

function createMockWindow(): MockWindow {
  listeners = new Map();
  return {
    addEventListener(type, fn) {
      const arr = listeners.get(type) ?? [];
      arr.push(fn);
      listeners.set(type, arr);
    },
    dispatchEvent(event) {
      for (const fn of listeners.get(event.type) ?? []) fn(event);
    },
    history: {
      pushState(_state, _title, url) {
        pathname = url;
      },
      replaceState(_state, _title, url) {
        pathname = url;
      },
    },
    location: {
      get pathname() {
        return pathname;
      },
    },
  };
}

mockWindow = createMockWindow();
vi.stubGlobal('window', mockWindow);

const { getLocale, resetLocale, setLocale, subscribeLocale } = await import(
  './store'
);

afterEach(() => {
  resetLocale();
  pathname = '/en/home';
});

describe('setLocale', () => {
  describe('with url persistence', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('ignores the call without updating the in-memory locale', () => {
      const before = getLocale();
      setLocale('sv');
      expect(getLocale()).toBe(before);
    });

    it('warns in dev mode when called', () => {
      setLocale('sv');
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0]?.[0]).toContain('no-op');
      expect(warnSpy.mock.calls[0]?.[0]).toContain('url');
    });

    it('does not notify subscribers', () => {
      const listener = vi.fn();
      subscribeLocale(listener);
      setLocale('sv');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('subscribeLocale', () => {
  describe('with url persistence', () => {
    it('notifies on popstate when URL contains a known locale', () => {
      const listener = vi.fn();
      subscribeLocale(listener);
      pathname = '/sv/home';
      mockWindow.dispatchEvent(new Event('popstate'));
      expect(getLocale()).toBe('sv');
      expect(listener).toHaveBeenCalledWith('sv');
    });

    it('notifies on pushState when URL contains a known locale', () => {
      const listener = vi.fn();
      subscribeLocale(listener);
      mockWindow.history.pushState({}, '', '/fr/home');
      expect(getLocale()).toBe('fr');
      expect(listener).toHaveBeenCalledWith('fr');
    });

    it('notifies on replaceState when URL contains a known locale', () => {
      const listener = vi.fn();
      subscribeLocale(listener);
      mockWindow.history.replaceState({}, '', '/sv/about');
      expect(getLocale()).toBe('sv');
      expect(listener).toHaveBeenCalledWith('sv');
    });

    it('does not notify when URL has no known locale', () => {
      const listener = vi.fn();
      subscribeLocale(listener);
      mockWindow.history.pushState({}, '', '/about');
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify when URL change keeps the same locale', () => {
      const listener = vi.fn();
      subscribeLocale(listener);
      mockWindow.history.pushState({}, '', '/en/dashboard');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
