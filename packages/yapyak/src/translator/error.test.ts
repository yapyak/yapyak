import { describe, expect, it } from 'vitest';

import {
  TranslatorAuthError,
  TranslatorError,
  TranslatorNetworkError,
  TranslatorRateLimitError,
  TranslatorSafetyError,
  TranslatorTimeoutError,
  TranslatorTruncatedError,
  causeToError,
  responseToError,
} from './error';

describe('TranslatorError', () => {
  it('holds the vendor', () => {
    const error = new TranslatorError('Boom.', {
      vendor: 'anthropic',
    });
    expect(error.vendor).toBe('anthropic');
  });

  it('forwards the cause through the `Error.cause` field when supplied', () => {
    const cause = new Error('Underlying');
    const error = new TranslatorError('Boom.', {
      cause,
      vendor: 'anthropic',
    });
    expect(error.cause).toBe(cause);
  });
});

describe('TranslatorRateLimitError', () => {
  it('holds the `retryAfter` when supplied', () => {
    const error = new TranslatorRateLimitError('Too many.', {
      retryAfter: 5000,
      vendor: 'openai',
    });
    expect(error.retryAfter).toBe(5000);
    expect(error.name).toBe('TranslatorRateLimitError');
  });

  it('holds `TranslatorError` in its prototype chain', () => {
    const error = new TranslatorRateLimitError('Too many.', {
      vendor: 'openai',
    });
    expect(error).toBeInstanceOf(TranslatorError);
  });
});

describe('responseToError', () => {
  it('maps HTTP 429 to a `TranslatorRateLimitError`', async () => {
    const response = new Response('rate-limited', {
      headers: {
        'retry-after': '7',
      },
      status: 429,
    });
    const error = await responseToError(response, 'openai');
    expect(error).toBeInstanceOf(TranslatorRateLimitError);
    expect((error as TranslatorRateLimitError).retryAfter).toBe(7000);
  });

  it('maps HTTP 429 with an HTTP-date Retry-After to a millisecond delta', async () => {
    const future = new Date(Date.now() + 12_000).toUTCString();
    const response = new Response('rate-limited', {
      headers: {
        'retry-after': future,
      },
      status: 429,
    });
    const error = await responseToError(response, 'openai');
    expect(error).toBeInstanceOf(TranslatorRateLimitError);
    const retryAfter = (error as TranslatorRateLimitError).retryAfter ?? 0;
    expect(retryAfter).toBeGreaterThan(9000);
    expect(retryAfter).toBeLessThan(15_000);
  });

  it('maps HTTP 401 to a `TranslatorAuthError`', async () => {
    const error = await responseToError(
      new Response('unauthorized', {
        status: 401,
      }),
      'anthropic',
    );
    expect(error).toBeInstanceOf(TranslatorAuthError);
  });

  it('maps HTTP 403 to a `TranslatorAuthError`', async () => {
    const error = await responseToError(
      new Response('forbidden', {
        status: 403,
      }),
      'gemini',
    );
    expect(error).toBeInstanceOf(TranslatorAuthError);
  });

  it('maps other non-OK statuses to a `TranslatorNetworkError` carrying the status', async () => {
    const error = await responseToError(
      new Response('server error', {
        status: 503,
      }),
      'ollama',
    );
    expect(error).toBeInstanceOf(TranslatorNetworkError);
    expect((error as TranslatorNetworkError).status).toBe(503);
  });

  it('extracts the nested `error.message` from a JSON body', async () => {
    const body = JSON.stringify({
      error: {
        message: 'Your credit balance is too low',
        type: 'invalid_request_error',
      },
      type: 'error',
    });
    const error = await responseToError(
      new Response(body, {
        status: 400,
      }),
      'anthropic',
    );
    expect(error.message).toBe(
      'yapyak anthropic: HTTP 400 — Your credit balance is too low',
    );
  });

  it('extracts the top-level `message` from a JSON body', async () => {
    const body = JSON.stringify({
      message: 'Quota exceeded',
    });
    const error = await responseToError(
      new Response(body, {
        status: 400,
      }),
      'openai',
    );
    expect(error.message).toBe('yapyak openai: HTTP 400 — Quota exceeded');
  });

  it('falls back to the raw body when JSON parsing fails', async () => {
    const error = await responseToError(
      new Response('plain text error', {
        status: 500,
      }),
      'ollama',
    );
    expect(error.message).toBe('yapyak ollama: HTTP 500 — plain text error');
  });
});

describe('causeToError', () => {
  it('maps an `AbortError` to a `TranslatorTimeoutError`', () => {
    const cause = new Error('aborted');
    cause.name = 'AbortError';
    const error = causeToError(cause, 'anthropic');
    expect(error).toBeInstanceOf(TranslatorTimeoutError);
  });

  it('maps a `TimeoutError` to a `TranslatorTimeoutError`', () => {
    const cause = new Error('timed out');
    cause.name = 'TimeoutError';
    const error = causeToError(cause, 'anthropic');
    expect(error).toBeInstanceOf(TranslatorTimeoutError);
  });

  it('maps any other error to a `TranslatorNetworkError`', () => {
    const error = causeToError(new TypeError('fetch failed'), 'openai');
    expect(error).toBeInstanceOf(TranslatorNetworkError);
  });
});

describe('subclass identity', () => {
  it('holds distinct error names for instanceof-friendly catch blocks', () => {
    expect(
      new TranslatorAuthError('a', {
        vendor: 'x',
      }).name,
    ).toBe('TranslatorAuthError');
    expect(
      new TranslatorTruncatedError('a', {
        vendor: 'x',
      }).name,
    ).toBe('TranslatorTruncatedError');
    expect(
      new TranslatorSafetyError('a', {
        vendor: 'x',
      }).name,
    ).toBe('TranslatorSafetyError');
    expect(
      new TranslatorNetworkError('a', {
        vendor: 'x',
      }).name,
    ).toBe('TranslatorNetworkError');
  });
});
