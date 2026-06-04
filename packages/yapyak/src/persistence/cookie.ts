import type { Persistence } from './type';

import { appendResponseHeader } from '../locale/response-header-writer';
import { subscribeHistory } from './history';

const POLL_INTERVAL_MS = 1000;

function subscribePoll(onChange: () => void): () => void {
  let intervalId: number | undefined;
  const start = (): void => {
    intervalId ??= window.setInterval(onChange, POLL_INTERVAL_MS);
  };
  const stop = (): void => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };
  const sync = (): void => {
    if (document.visibilityState === 'visible') {
      onChange();
      start();
    } else {
      stop();
    }
  };
  document.addEventListener('visibilitychange', sync);
  if (document.visibilityState === 'visible') {
    start();
  }
  return (): void => {
    document.removeEventListener('visibilitychange', sync);
    stop();
  };
}

export function parseCookie(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (header === '') {
    return result;
  }
  for (const segment of header.split(';')) {
    const trimmed = segment.trim();
    if (trimmed === '') {
      continue;
    }
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }
    const name = trimmed.slice(0, equalsIndex).trim();
    if (name === '') {
      continue;
    }
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const unquoted =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;
    try {
      result[name] = decodeURIComponent(unquoted);
    } catch {
      result[name] = unquoted;
    }
  }
  return result;
}

interface CookieOptions {
  name: string;
}

export function cookie(options: CookieOptions): Persistence {
  const { name } = options;
  return {
    get() {
      if (typeof globalThis.document === 'undefined') {
        return undefined;
      }
      const value = parseCookie(globalThis.document.cookie)[name];
      return value || undefined;
    },
    getFromRequest(request) {
      const header = request.headers.get('cookie');
      if (header === null) {
        return undefined;
      }
      const value = parseCookie(header)[name];
      return value || undefined;
    },
    set(locale) {
      const value = encodeURIComponent(locale);
      const cookieString = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
      if (typeof globalThis.document === 'undefined') {
        const applied = appendResponseHeader('Set-Cookie', cookieString);
        if (!applied && process.env.NODE_ENV !== 'production') {
          console.warn(
            '[yapyak] setLocale() called server-side outside a withRequest scope. The cookie was not set. Install the matching adapter middleware (e.g. @yapyak/astro, @yapyak/sveltekit).',
          );
        }
        return true;
      }
      // biome-ignore lint/suspicious/noDocumentCookie: yap yap yap
      globalThis.document.cookie = cookieString;
      return false;
    },
    subscribe(onChange) {
      if (typeof window === 'undefined') {
        return () => {};
      }
      const { cookieStore } = window as typeof window & {
        cookieStore?: EventTarget;
      };
      if (cookieStore) {
        cookieStore.addEventListener('change', onChange);
        return () => {
          cookieStore.removeEventListener('change', onChange);
        };
      }
      const unsubscribeHistory = subscribeHistory(onChange);
      const unsubscribePoll = subscribePoll(onChange);
      return () => {
        unsubscribeHistory();
        unsubscribePoll();
      };
    },
  };
}
