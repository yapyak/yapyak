import { afterEach, describe, expect, it } from 'vitest';

import {
  appendPendingResponseHeader,
  resetResponseHeaderWriter,
  setResponseHeaderWriter,
} from './pending-response-header';

describe('pending-response-header', () => {
  afterEach(() => {
    resetResponseHeaderWriter();
  });

  it('returns `false` from `appendPendingResponseHeader` when no writer is registered', () => {
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
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
    appendPendingResponseHeader('Set-Cookie', 'locale=sv');
    expect(writes).toEqual([
      [
        'Set-Cookie',
        'locale=sv',
      ],
    ]);
  });

  it('returns `true` from `appendPendingResponseHeader` when a writer is registered', () => {
    setResponseHeaderWriter(() => {});
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(true);
  });

  it('clears the writer when `resetResponseHeaderWriter` is called', () => {
    setResponseHeaderWriter(() => {});
    resetResponseHeaderWriter();
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('writes through only the latest writer when called twice', () => {
    const firstWriterCalls: string[] = [];
    const secondWriterCalls: string[] = [];
    setResponseHeaderWriter((_name: string, value: string) =>
      firstWriterCalls.push(value),
    );
    setResponseHeaderWriter((_name: string, value: string) =>
      secondWriterCalls.push(value),
    );
    appendPendingResponseHeader('Set-Cookie', 'locale=sv');
    expect(firstWriterCalls).toEqual([]);
    expect(secondWriterCalls).toEqual([
      'locale=sv',
    ]);
  });
});
