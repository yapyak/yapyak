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
  it('carries the vendor', () => {
    const error = new TranslatorError('Boom.', {
      vendor: 'anthropic',
    });
    expect(error.vendor).toBe('anthropic');
  });

  it('wires the cause through via the `Error.cause` field when supplied', () => {
    const cause = new Error('Underlying');
    const error = new TranslatorError('Boom.', {
      cause,
      vendor: 'anthropic',
    });
    expect(error.cause).toBe(cause);
  });
});

describe('TranslatorRateLimitError', () => {
  it('carries the retryAfter when supplied', () => {
    const error = new TranslatorRateLimitError('Too many.', {
      retryAfter: 5000,
      vendor: 'openai',
    });
    expect(error.retryAfter).toBe(5000);
    expect(error.name).toBe('TranslatorRateLimitError');
  });

  it('is an instance of `TranslatorError`', () => {
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
  it('exposes distinct error names for instanceof-friendly catch blocks', () => {
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
