import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
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

describe('locale with persistence: url', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('setLocale is a no-op — does not update the in-memory locale', () => {
    const before = getLocale();
    setLocale('sv');
    expect(getLocale()).toBe(before);
  });

  it('setLocale warns in dev mode when called with url persistence', () => {
    setLocale('sv');
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('no-op');
    expect(warnSpy.mock.calls[0]?.[0]).toContain('url');
  });

  it('setLocale does not notify subscribers', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    setLocale('sv');
    expect(listener).not.toHaveBeenCalled();
  });

  it('popstate triggers locale sync from URL', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    pathname = '/sv/home';
    mockWindow.dispatchEvent(new Event('popstate'));
    expect(getLocale()).toBe('sv');
    expect(listener).toHaveBeenCalledWith('sv');
  });

  it('pushState triggers locale sync from URL', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    mockWindow.history.pushState({}, '', '/fr/home');
    expect(getLocale()).toBe('fr');
    expect(listener).toHaveBeenCalledWith('fr');
  });

  it('replaceState triggers locale sync from URL', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    mockWindow.history.replaceState({}, '', '/sv/about');
    expect(getLocale()).toBe('sv');
    expect(listener).toHaveBeenCalledWith('sv');
  });

  it('URL change without a known locale does not update', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    mockWindow.history.pushState({}, '', '/about');
    expect(listener).not.toHaveBeenCalled();
  });

  it('URL change to the same locale does not re-notify', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    mockWindow.history.pushState({}, '', '/en/dashboard');
    expect(listener).not.toHaveBeenCalled();
  });
});
