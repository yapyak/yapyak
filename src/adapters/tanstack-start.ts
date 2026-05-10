import { getRequestHeaders } from '@tanstack/react-start/server';
import { setRequestSource } from '../locale/store.js';

export function attachTanstackStart(): void {
  setRequestSource(() => {
    const headers = getRequestHeaders();
    return {
      acceptLanguage: headers.get('accept-language') ?? undefined,
      cookieHeader: headers.get('cookie') ?? undefined,
    };
  });
}
