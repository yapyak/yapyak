import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@yapyak/shared', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { name: 'locale', type: 'cookie' },
  SYNC_HTML_LANG: true,
}));

type Store = typeof import('./store');
type Listener = (event: Event) => void;

let cookieValue = '';
let documentListeners: Map<string, Listener[]>;
let visibilityState: DocumentVisibilityState;

function stubDocument(): void {
  documentListeners = new Map();
  visibilityState = 'visible';
  vi.stubGlobal('document', {
    addEventListener(type: string, fn: Listener) {
      const arr = documentListeners.get(type) ?? [];
      arr.push(fn);
      documentListeners.set(type, arr);
    },
    get cookie() {
      return cookieValue;
    },
    set cookie(value: string) {
      cookieValue = value;
    },
    documentElement: { lang: '' },
    get visibilityState() {
      return visibilityState;
    },
  });
}

function dispatchDocument(type: string): void {
  for (const fn of documentListeners.get(type) ?? []) {
    fn(new Event(type));
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('subscribeLocale with cookie persistence', () => {
  describe('Cookie Store API available', () => {
    let cookieStore: EventTarget;
    let store: Store;

    beforeEach(async () => {
      vi.resetModules();
      cookieValue = 'locale=en';
      cookieStore = new EventTarget();
      stubDocument();
      vi.stubGlobal('window', { cookieStore });
      store = await import('./store');
    });

    it('re-reads the locale on a cookieStore change', () => {
      const listener = vi.fn();
      store.subscribeLocale(listener);
      cookieValue = 'locale=sv';
      cookieStore.dispatchEvent(new Event('change'));
      expect(store.getLocale()).toBe('sv');
      expect(listener).toHaveBeenCalledWith('sv');
    });

    it('updates the document language on change', () => {
      cookieValue = 'locale=fr';
      cookieStore.dispatchEvent(new Event('change'));
      expect(document.documentElement.lang).toBe('fr');
    });

    it('ignores a change to an unknown locale', () => {
      const listener = vi.fn();
      store.subscribeLocale(listener);
      cookieValue = 'locale=de';
      cookieStore.dispatchEvent(new Event('change'));
      expect(store.getLocale()).toBe('en');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Cookie Store API unavailable', () => {
    let windowListeners: Map<string, Listener[]>;
    let mockHistory: {
      pushState: (state: unknown, title: string, url: string) => void;
      replaceState: (state: unknown, title: string, url: string) => void;
    };
    let store: Store;

    beforeEach(async () => {
      vi.resetModules();
      vi.useFakeTimers();
      cookieValue = 'locale=en';
      windowListeners = new Map();
      stubDocument();
      vi.stubGlobal('window', {
        addEventListener(type: string, fn: Listener) {
          const arr = windowListeners.get(type) ?? [];
          arr.push(fn);
          windowListeners.set(type, arr);
        },
        clearInterval(id?: number) {
          globalThis.clearInterval(id);
        },
        history: {
          pushState() {},
          replaceState() {},
        },
        setInterval(handler: () => void, ms?: number) {
          return globalThis.setInterval(handler, ms);
        },
      });
      store = await import('./store');
      mockHistory = (window as unknown as { history: typeof mockHistory })
        .history;
    });

    it('re-reads the locale on a history navigation', () => {
      const listener = vi.fn();
      store.subscribeLocale(listener);
      cookieValue = 'locale=sv';
      mockHistory.pushState({}, '', '/');
      expect(store.getLocale()).toBe('sv');
      expect(listener).toHaveBeenCalledWith('sv');
    });

    it('re-reads the locale while polling when visible', () => {
      cookieValue = 'locale=sv';
      vi.advanceTimersByTime(1000);
      expect(store.getLocale()).toBe('sv');
    });

    it('stops polling when hidden and re-reads when visible again', () => {
      visibilityState = 'hidden';
      dispatchDocument('visibilitychange');
      cookieValue = 'locale=fr';
      vi.advanceTimersByTime(5000);
      expect(store.getLocale()).toBe('en');
      visibilityState = 'visible';
      dispatchDocument('visibilitychange');
      expect(store.getLocale()).toBe('fr');
    });
  });
});
