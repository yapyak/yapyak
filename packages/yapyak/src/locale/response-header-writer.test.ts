import { afterEach, describe, expect, it } from 'vitest';

import {
  appendResponseHeader,
  resetResponseHeaderWriter,
  setResponseHeaderWriter,
} from './response-header-writer';

describe('response-header-writer', () => {
  afterEach(() => {
    resetResponseHeaderWriter();
  });

  it('returns `false` from `appendResponseHeader` when no writer is registered', () => {
    expect(appendResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('notifies the registered writer with name and value', () => {
    const writes: [
      string,
      string,
    ][] = [];
    setResponseHeaderWriter((name, value) =>
      writes.push([
        name,
        value,
      ]),
    );
    appendResponseHeader('Set-Cookie', 'locale=sv');
    expect(writes).toEqual([
      [
        'Set-Cookie',
        'locale=sv',
      ],
    ]);
  });

  it('returns `true` from `appendResponseHeader` when a writer is registered', () => {
    setResponseHeaderWriter(() => {});
    expect(appendResponseHeader('Set-Cookie', 'locale=sv')).toBe(true);
  });

  it('clears the writer when `resetResponseHeaderWriter` is called', () => {
    setResponseHeaderWriter(() => {});
    resetResponseHeaderWriter();
    expect(appendResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('writes through only the latest writer when called twice', () => {
    const firstWriterCalls: string[] = [];
    const secondWriterCalls: string[] = [];
    setResponseHeaderWriter((_, value) => firstWriterCalls.push(value));
    setResponseHeaderWriter((_, value) => secondWriterCalls.push(value));
    appendResponseHeader('Set-Cookie', 'locale=sv');
    expect(firstWriterCalls).toEqual([]);
    expect(secondWriterCalls).toEqual([
      'locale=sv',
    ]);
  });
});
