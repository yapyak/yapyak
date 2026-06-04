export interface RetryableFetchOptions {
  init: RequestInit;
  maxRetries: number;
  signal?: AbortSignal;
  timeout: number;
  url: string;
}

export async function retryableFetch(
  options: RetryableFetchOptions,
): Promise<Response> {
  const { init, maxRetries, signal: outerSignal, timeout, url } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await delay(backoffMs(attempt));
    }
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    if (outerSignal) {
      if (outerSignal.aborted) {
        throw outerSignal.reason ?? new Error('Aborted');
      }
      outerSignal.addEventListener('abort', onAbort, { once: true });
    }
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.ok) {
        return response;
      }
      if (!isRetryable(response.status) || attempt === maxRetries) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
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
  throw lastError ?? new Error('retryableFetch: exhausted retries');
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

function backoffMs(attempt: number): number {
  return Math.min(8_000, 250 * 2 ** (attempt - 1));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
