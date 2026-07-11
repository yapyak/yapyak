import { afterEach, describe, expect, it } from 'vitest';

import {
  appendPendingResponseHeader,
  resetResponseHeaderWriter,
  setResponseHeaderWriter,
} from './pending-response-header';

afterEach(() => {
  resetResponseHeaderWriter();
});

describe('appendPendingResponseHeader', () => {
  it('returns `true` when the writer writes the header', () => {
    setResponseHeaderWriter(() => true);
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(true);
  });

  it('returns `false` when the writer does not write the header', () => {
    setResponseHeaderWriter(() => false);
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('returns `false` when no writer is registered', () => {
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });

  it('notifies the registered writer with name and value', () => {
    const writes: [
      string,
      string,
    ][] = [];
    setResponseHeaderWriter((name, value) => {
      writes.push([
        name,
        value,
      ]);
      return true;
    });
    appendPendingResponseHeader('Set-Cookie', 'locale=sv');
    expect(writes).toEqual([
      [
        'Set-Cookie',
        'locale=sv',
      ],
    ]);
  });
});

describe('resetResponseHeaderWriter', () => {
  it('clears the writer', () => {
    setResponseHeaderWriter(() => true);
    resetResponseHeaderWriter();
    expect(appendPendingResponseHeader('Set-Cookie', 'locale=sv')).toBe(false);
  });
});

describe('setResponseHeaderWriter', () => {
  it('writes through only the latest writer when called twice', () => {
    const firstWriterCalls: string[] = [];
    const secondWriterCalls: string[] = [];
    setResponseHeaderWriter((_name: string, value: string) => {
      firstWriterCalls.push(value);
      return true;
    });
    setResponseHeaderWriter((_name: string, value: string) => {
      secondWriterCalls.push(value);
      return true;
    });
    appendPendingResponseHeader('Set-Cookie', 'locale=sv');
    expect(firstWriterCalls).toEqual([]);
    expect(secondWriterCalls).toEqual([
      'locale=sv',
    ]);
  });
});
