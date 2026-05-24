import type { Persistence } from '.';

/** @internal */
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

export function cookie(name: string): Persistence {
  return {
    get() {
      if (typeof globalThis.document === 'undefined') {
        return undefined;
      }
      const cookies = parseCookie(globalThis.document.cookie);
      const value = cookies[name];
      return value === '' ? undefined : value;
    },
    set(locale) {
      if (typeof globalThis.document === 'undefined') {
        return;
      }
      const value = encodeURIComponent(locale);
      // biome-ignore lint/suspicious/noDocumentCookie: yap yap yap
      globalThis.document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
    },
  };
}
