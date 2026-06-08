import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithRetry } from './fetch';

const baseOptions = { init: {}, maxRetries: 2, timeout: 1000, url: 'http://x' };

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
      vi.fn().mockResolvedValue(new Response('ok', { status: 200 })),
    );
    const result = await fetchWithRetry({ ...baseOptions, maxRetries: 0 });
    expect(result.ok).toBe(true);
  });

  it('returns a non-retryable error response without retrying', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('bad', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchWithRetry({ ...baseOptions, maxRetries: 3 });
    expect(result.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns a 5xx response and returns the eventual success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const promise = fetchWithRetry({ ...baseOptions, maxRetries: 2 });
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
      fetchWithRetry({ ...baseOptions, signal: controller.signal }),
    ).rejects.toThrow('user aborted');
  });

  it('throws a network error after exhausting retries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('boom')));
    const promise = fetchWithRetry({ ...baseOptions, maxRetries: 1 });
    const expectation = expect(promise).rejects.toThrow('boom');
    await vi.runAllTimersAsync();
    await expectation;
  });
});
