import { parseRetryAfterMs } from './fetch';

/**
 * Base error thrown by every yapyak translator.
 *
 * @remarks
 * Catch this to handle every translator failure mode uniformly. Use the
 * subclasses ({@link TranslatorRateLimitError}, {@link TranslatorAuthError},
 * {@link TranslatorInvalidResponseError}, {@link TranslatorTruncatedError},
 * {@link TranslatorTimeoutError}, {@link TranslatorSafetyError},
 * {@link TranslatorNetworkError}) for typed discrimination.
 *
 * @example Handle a translator failure
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
  vendor: string;

  constructor(
    message: string,
    options: {
      cause?: unknown;
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
    this.vendor = options.vendor;
  }
}

/**
 * Thrown when the translator API returned HTTP 429 (rate limit exceeded).
 *
 * @remarks
 * The {@link retryAfter} field carries the server-suggested wait in
 * milliseconds, parsed from the `Retry-After` header. Falls back to
 * `undefined` when the header is missing or malformed.
 */
export class TranslatorRateLimitError extends TranslatorError {
  retryAfter: number | undefined;

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
    this.retryAfter = options.retryAfter;
  }
}

/** Thrown when the translator API returned HTTP 401 or 403 (auth failed). */
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
 * Thrown when the translator API response is not parseable JSON, the wrong
 * shape, or otherwise unusable. Includes responses that exceed the configured
 * token budget but were not flagged truncated by the API itself.
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
 * Thrown when the translator API signaled the response was truncated by the
 * token limit (e.g. Anthropic `stop_reason: max_tokens`, OpenAI
 * `finish_reason: length`, Gemini `finishReason: MAX_TOKENS`, Ollama
 * `done_reason: length`).
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
 * Thrown when the translator API blocked the response via a safety/content
 * filter (e.g. Gemini `finishReason: SAFETY` or `RECITATION`).
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
 * Thrown when the translator API returned a non-retryable HTTP error
 * (status other than 401/403/429) or when the fetch layer failed for
 * reasons other than timeout/abort.
 */
export class TranslatorNetworkError extends TranslatorError {
  status: number | undefined;

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
    this.status = options.status;
  }
}

/**
 * Converts a non-OK {@link Response} into the appropriate {@link TranslatorError}.
 *
 * @param response - The non-OK HTTP response from the translator API.
 * @param vendor - The translator vendor id (e.g. `'anthropic'`).
 * @returns A {@link TranslatorRateLimitError} for `429`, {@link TranslatorAuthError}
 *   for `401`/`403`, otherwise {@link TranslatorNetworkError} carrying the status.
 */
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
  const message = `yapyak ${vendor}: HTTP ${response.status}${body === '' ? '' : ` ${body}`}`;
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

/**
 * Converts an error thrown by the fetch layer (abort, timeout, network) into
 * the appropriate {@link TranslatorError}.
 *
 * @param cause - The error caught around `fetchWithRetry` (or `fetch`).
 * @param vendor - The translator vendor id.
 * @returns A {@link TranslatorTimeoutError} for abort/timeout signals,
 *   otherwise {@link TranslatorNetworkError}.
 */
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
