export type FetchWithRetryOptions = {
  maxRetries?: number;
  signal?: AbortSignal;
  timeout?: number;
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30_000;
const MAX_BACKOFF_MS = 8000;
const MAX_RETRY_AFTER_MS = 60_000;
const BASE_BACKOFF_MS = 250;
const JITTER_RANGE = 0.4;

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: FetchWithRetryOptions,
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const outerSignal = options?.signal;
  let lastError: unknown;
  let nextBackoffMs: number | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await delay(nextBackoffMs ?? getBackoffMs(attempt), outerSignal);
      nextBackoffMs = undefined;
    }
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    if (outerSignal) {
      if (outerSignal.aborted) {
        throw outerSignal.reason ?? new Error('Aborted');
      }
      outerSignal.addEventListener('abort', onAbort, {
        once: true,
      });
    }
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      if (response.ok) {
        return response;
      }
      if (!isRetryable(response.status) || attempt === maxRetries) {
        return response;
      }
      nextBackoffMs = resolveRetryDelayMs(
        response.headers.get('retry-after'),
        attempt + 1,
      );
      lastError = new Error(`HTTP ${response.status}`);
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (
        outerSignal?.aborted ||
        attempt === maxRetries ||
        !isNetworkError(error)
      ) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
      outerSignal?.removeEventListener('abort', onAbort);
    }
  }
  throw lastError ?? new Error('fetchWithRetry: exhausted retries');
}

function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }
  return error instanceof TypeError;
}

export function parseRetryAfterMs(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return seconds * 1000;
  }
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  return Math.max(0, timestamp - Date.now());
}

function resolveRetryDelayMs(
  retryAfter: string | null,
  attempt: number,
): number {
  const fromHeader = parseRetryAfterMs(retryAfter);
  if (fromHeader !== undefined) {
    return Math.min(MAX_RETRY_AFTER_MS, fromHeader);
  }
  return getBackoffMs(attempt);
}

function getBackoffMs(attempt: number): number {
  const exponential = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  const jitterFactor = 1 - JITTER_RANGE / 2 + Math.random() * JITTER_RANGE;
  return Math.min(MAX_BACKOFF_MS, exponential * jitterFactor);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Aborted'));
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('Aborted'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, {
      once: true,
    });
  });
}
