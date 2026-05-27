import { afterEach, describe, expect, it } from 'vitest';

import {
  appendResponseHeader,
  setResponseHeaderWriter,
} from './response-header-writer';

describe('response-header-writer', () => {
  afterEach(() => {
    setResponseHeaderWriter(null);
  });

  it('returns `false` from `appendResponseHeader` when no writer is registered', () => {
    expect(appendResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('invokes the registered writer with name and value', () => {
    const writes: Array<[string, string]> = [];
    setResponseHeaderWriter((name, value) => writes.push([name, value]));
    appendResponseHeader('Set-Cookie', 'locale=sv');
    expect(writes).toEqual([['Set-Cookie', 'locale=sv']]);
  });

  it('returns `true` from `appendResponseHeader` when a writer is registered', () => {
    setResponseHeaderWriter(() => {});
    expect(appendResponseHeader('Set-Cookie', 'locale=sv')).toBe(true);
  });

  it('unregisters the writer when `setResponseHeaderWriter` receives `null`', () => {
    setResponseHeaderWriter(() => {});
    setResponseHeaderWriter(null);
    expect(appendResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('replaces the previous writer when called twice', () => {
    const a: string[] = [];
    const b: string[] = [];
    setResponseHeaderWriter((_, value) => a.push(value));
    setResponseHeaderWriter((_, value) => b.push(value));
    appendResponseHeader('Set-Cookie', 'locale=sv');
    expect(a).toEqual([]);
    expect(b).toEqual(['locale=sv']);
  });
});
