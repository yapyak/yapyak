import { parseRetryAfterMs } from './fetch';

/**
 * Base error thrown by every yapyak translator.
 *
 * @example
 * ```ts
 * import { TranslatorError, TranslatorRateLimitError } from 'yapyak/translator';
 *
 * try {
 *   await translator(...);
 * } catch (error) {
 *   if (error instanceof TranslatorRateLimitError) {
 *     await delay(error.retryAfter ?? 30_000);
 *   } else if (error instanceof TranslatorError) {
 *     log(`Translator ${error.vendor} failed: ${error.message}`);
 *   } else {
 *     throw error;
 *   }
 * }
 * ```
 */
export class TranslatorError extends Error {
  /** The suggested wait in milliseconds. */
  retryAfter: number | undefined;

  /** The HTTP status code. */
  status: number | undefined;

  /** The translator vendor id. */
  vendor: string;

  constructor(
    message: string,
    options: {
      cause?: unknown;
      retryAfter?: number;
      status?: number;
      vendor: string;
    },
  ) {
    super(
      message,
      options.cause === undefined
        ? undefined
        : {
            cause: options.cause,
          },
    );
    this.name = 'TranslatorError';
    this.retryAfter = options.retryAfter;
    this.status = options.status;
    this.vendor = options.vendor;
  }
}

/**
 * Thrown when the translator API returned HTTP 429.
 */
export class TranslatorRateLimitError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      retryAfter?: number;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorRateLimitError';
  }
}

/** Thrown when the translator API returned HTTP 401 or 403. */
export class TranslatorAuthError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorAuthError';
  }
}

/**
 * Thrown when the translator API response is not parseable or has the wrong shape.
 */
export class TranslatorInvalidResponseError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorInvalidResponseError';
  }
}

/**
 * Thrown when the translator API signaled the response was truncated by the token limit.
 */
export class TranslatorTruncatedError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorTruncatedError';
  }
}

/** Thrown when the translator request timed out or was aborted. */
export class TranslatorTimeoutError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorTimeoutError';
  }
}

/**
 * Thrown when the translator API blocked the response via a safety filter.
 */
export class TranslatorSafetyError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorSafetyError';
  }
}

/**
 * Thrown when the translator API returned a non-retryable HTTP error or the fetch layer failed.
 */
export class TranslatorNetworkError extends TranslatorError {
  constructor(
    message: string,
    options: {
      cause?: unknown;
      status?: number;
      vendor: string;
    },
  ) {
    super(message, options);
    this.name = 'TranslatorNetworkError';
  }
}

export async function responseToError(
  response: Response,
  vendor: string,
): Promise<TranslatorError> {
  let body: string;
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  const detail = extractBodyDetail(body);
  const message = `yapyak ${vendor}: HTTP ${response.status}${detail === '' ? '' : ` — ${detail}`}`;
  if (response.status === 429) {
    return new TranslatorRateLimitError(message, {
      retryAfter: parseRetryAfterMs(response.headers.get('retry-after')),
      vendor,
    });
  }
  if (response.status === 401 || response.status === 403) {
    return new TranslatorAuthError(message, {
      vendor,
    });
  }
  return new TranslatorNetworkError(message, {
    status: response.status,
    vendor,
  });
}

function extractBodyDetail(body: string): string {
  if (body === '') {
    return '';
  }
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const nested = record.error;
      if (nested && typeof nested === 'object') {
        const nestedMessage = (nested as Record<string, unknown>).message;
        if (typeof nestedMessage === 'string' && nestedMessage !== '') {
          return nestedMessage;
        }
      }
      if (typeof record.message === 'string' && record.message !== '') {
        return record.message;
      }
    }
  } catch {}
  return body;
}

export function causeToError(cause: unknown, vendor: string): TranslatorError {
  if (cause instanceof Error) {
    if (cause.name === 'AbortError' || cause.name === 'TimeoutError') {
      return new TranslatorTimeoutError(
        `yapyak ${vendor}: request timed out or was aborted.`,
        {
          cause,
          vendor,
        },
      );
    }
  }
  const reason = cause instanceof Error ? cause.message : String(cause);
  return new TranslatorNetworkError(
    `yapyak ${vendor}: network error — ${reason}.`,
    {
      cause,
      vendor,
    },
  );
}
