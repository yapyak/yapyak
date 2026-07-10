import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithRetry, parseRetryAfterMs } from './fetch';

const URL = 'http://x';
const INIT: RequestInit = {};

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns the response on a successful first attempt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('ok', {
          status: 200,
        }),
      ),
    );
    const result = await fetchWithRetry(URL, INIT, {
      maxRetries: 0,
      timeout: 1000,
    });
    expect(result.ok).toBe(true);
  });

  it('returns a non-retryable error response without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('bad', {
        status: 400,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchWithRetry(URL, INIT, {
      maxRetries: 3,
      timeout: 1000,
    });
    expect(result.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns a 5xx response and returns the eventual success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('', {
          status: 500,
        }),
      )
      .mockResolvedValueOnce(
        new Response('ok', {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const promise = fetchWithRetry(URL, INIT, {
      maxRetries: 2,
      timeout: 1000,
    });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws immediately when the outer signal is already aborted', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const controller = new AbortController();
    controller.abort(new Error('user aborted'));
    await expect(
      fetchWithRetry(URL, INIT, {
        maxRetries: 2,
        signal: controller.signal,
        timeout: 1000,
      }),
    ).rejects.toThrow('user aborted');
  });

  it('throws when the signal aborts during a backoff sleep', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 500,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const promise = fetchWithRetry(URL, INIT, {
      maxRetries: 2,
      signal: controller.signal,
      timeout: 1000,
    });
    const expectation = expect(promise).rejects.toThrow('user aborted');
    await vi.advanceTimersByTimeAsync(0);
    controller.abort(new Error('user aborted'));
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws a network error after exhausting retries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('boom')));
    const promise = fetchWithRetry(URL, INIT, {
      maxRetries: 1,
      timeout: 1000,
    });
    const expectation = expect(promise).rejects.toThrow('boom');
    await vi.runAllTimersAsync();
    await expectation;
  });

  it('returns the response after the `Retry-After` delay on a 429', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('rate limited', {
          headers: {
            'retry-after': '2',
          },
          status: 429,
        }),
      )
      .mockResolvedValueOnce(
        new Response('ok', {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const promise = fetchWithRetry(URL, INIT, {
      maxRetries: 1,
      timeout: 1000,
    });
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns the response after a `Retry-After` delay above the backoff cap', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('rate limited', {
          headers: {
            'retry-after': '30',
          },
          status: 429,
        }),
      )
      .mockResolvedValueOnce(
        new Response('ok', {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const promise = fetchWithRetry(URL, INIT, {
      maxRetries: 1,
      timeout: 60_000,
    });
    await vi.advanceTimersByTimeAsync(29_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('truncates the `Retry-After` delay to 60 seconds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('rate limited', {
          headers: {
            'retry-after': '120',
          },
          status: 429,
        }),
      )
      .mockResolvedValueOnce(
        new Response('ok', {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const promise = fetchWithRetry(URL, INIT, {
      maxRetries: 1,
      timeout: 120_000,
    });
    await vi.advanceTimersByTimeAsync(59_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('parseRetryAfterMs', () => {
  it('returns undefined for a `null` header value', () => {
    expect(parseRetryAfterMs(null)).toBeUndefined();
  });

  it('returns undefined for an empty header value', () => {
    expect(parseRetryAfterMs('')).toBeUndefined();
  });

  it('parses an integer-seconds header value', () => {
    expect(parseRetryAfterMs('5')).toBe(5000);
  });

  it('parses an HTTP-date header value into a millisecond offset', () => {
    const future = new Date(Date.now() + 10_000).toUTCString();
    const ms = parseRetryAfterMs(future);
    expect(ms).toBeGreaterThanOrEqual(8000);
    expect(ms).toBeLessThanOrEqual(11_000);
  });

  it('returns `0` for a past HTTP-date header value', () => {
    const past = new Date(Date.now() - 60_000).toUTCString();
    expect(parseRetryAfterMs(past)).toBe(0);
  });

  it('returns undefined for an unparseable header value', () => {
    expect(parseRetryAfterMs('not a date')).toBeUndefined();
  });
});
