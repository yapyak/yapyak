import type { Persistence } from './type';

import { warnDiagnostic } from '../diagnostic';
import { subscribeHistory } from './history';
import { appendPendingResponseHeader } from './pending-response-header';

type CookieOptions = {
  name: string;
  secure?: boolean;
};

const POLL_INTERVAL_MS = 1000;
const COOKIE_MAX_AGE_SECONDS = 31_536_000;
const COOKIE_NAME_RX = /^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/;

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
    if (Object.hasOwn(result, name)) {
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

export function cookie(options: CookieOptions): Persistence {
  const { name, secure = false } = options;
  if (!COOKIE_NAME_RX.test(name)) {
    throw new Error(
      `[yapyak] Invalid cookie name "${name}". Must match RFC 6265 token syntax: alphanumeric and !#$%&'*+-.^_\`|~ only.`,
    );
  }
  const attributes = `path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax${
    secure ? '; secure' : ''
  }`;
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
      const cookieString = `${name}=${value}; ${attributes}`;
      if (typeof globalThis.document === 'undefined') {
        const applied = appendPendingResponseHeader('Set-Cookie', cookieString);
        if (!applied) {
          warnDiagnostic('PERSISTENCE_COOKIE_WRITER_MISSING', undefined);
        }
        return false;
      }
      // biome-ignore lint/suspicious/noDocumentCookie: yap yap yap
      globalThis.document.cookie = cookieString;
      return true;
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
