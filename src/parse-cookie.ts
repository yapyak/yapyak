export function parseCookie(
  cookieString: string,
  name: string,
): string | undefined {
  if (!cookieString) {
    return undefined;
  }
  const pattern = new RegExp(
    `(?:^|; )${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}=([^;]*)`,
  );
  const match = cookieString.match(pattern);
  if (!match) {
    return undefined;
  }
  return decodeURIComponent(match[1] ?? '');
}

export function serializeCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string } = {},
): string {
  const { maxAge = 31536000, path = '/' } = options;
  return `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=Lax`;
}

export function parseAcceptLanguage(
  header: string,
  available: string[],
): string | undefined {
  if (!header) {
    return undefined;
  }
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, ...rest] = part.trim().split(';');
      const qPart = rest.find((entry) => entry.trim().startsWith('q='));
      const q = qPart ? Number.parseFloat(qPart.split('=')[1] ?? '1') : 1;
      return { q, tag: (tag ?? '').trim().toLowerCase() };
    })
    .sort((a, b) => b.q - a.q);
  for (const entry of entries) {
    const exact = available.find(
      (locale) => locale.toLowerCase() === entry.tag,
    );
    if (exact) {
      return exact;
    }
    const base = entry.tag.split('-')[0];
    const partial = available.find(
      (locale) => locale.toLowerCase().split('-')[0] === base,
    );
    if (partial) {
      return partial;
    }
  }
  return undefined;
}
