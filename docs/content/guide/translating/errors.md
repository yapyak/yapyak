---
title: Errors
order: 10
---

Translator failures surface as typed errors from `yapyak/translator`. [`TranslatorError`](/reference/yapyak/translator/TranslatorError) is the base; the seven specific types extend it.

```ts
import { TranslatorError } from 'yapyak/translator';

try {
  // a custom translator invocation, or an internal call
} catch (cause) {
  if (cause instanceof TranslatorError) {
    // typed handling per cause.constructor
  }
}
```

## The error types

| Class | Fires on | Carries |
|---|---|---|
| [`TranslatorAuthError`](/reference/yapyak/translator/TranslatorAuthError) | HTTP 401 or 403. Bad or missing API key. | `vendor` |
| [`TranslatorRateLimitError`](/reference/yapyak/translator/TranslatorRateLimitError) | HTTP 429. Provider rate limit. | `vendor`, `retryAfter` (ms) when the provider sent one |
| [`TranslatorTimeoutError`](/reference/yapyak/translator/TranslatorTimeoutError) | Request exceeded `timeout` or was aborted. | `vendor` |
| [`TranslatorNetworkError`](/reference/yapyak/translator/TranslatorNetworkError) | Other HTTP failures and network errors. | `vendor`, `status` when known |
| [`TranslatorSafetyError`](/reference/yapyak/translator/TranslatorSafetyError) | Provider blocked content. Anthropic refusal, OpenAI content filter, Gemini SAFETY or RECITATION. | `vendor` |
| [`TranslatorInvalidResponseError`](/reference/yapyak/translator/TranslatorInvalidResponseError) | Model returned something that doesn't parse. | `vendor` |
| [`TranslatorTruncatedError`](/reference/yapyak/translator/TranslatorTruncatedError) | Model output was cut off by the token limit. | `vendor` |

## Retry behavior

Retries happen inside the provider's fetch layer **before** any typed error is constructed. yapyak retries on HTTP 408, 429, 5xx, and on network-level failures (aborted, timed out, connection failed). Everything else fails fast. You only see an error after retries run out, or when the failure can't be retried.

| Source of failure | Retried? | Surfaces as |
|---|---|---|
| HTTP 429 | Yes. Backoff up to `maxRetries`. Honors `Retry-After` up to 60 seconds. | `TranslatorRateLimitError` |
| HTTP 408 / 5xx | Yes. Up to `maxRetries`. | `TranslatorNetworkError` (with `status`) |
| Network failure (abort, timeout, connection error) | Yes. Up to `maxRetries`. | `TranslatorTimeoutError` or `TranslatorNetworkError` |
| HTTP 4xx (other than 408/429) | No. | `TranslatorNetworkError` (with `status`) |
| HTTP 401 / 403 | No. Retries don't help a bad key. | `TranslatorAuthError` |
| Provider safety block | No. The block is a verdict, not a transient. | `TranslatorSafetyError` |
| Unparseable response | No. | `TranslatorInvalidResponseError` |
| Truncated by token limit | No. | `TranslatorTruncatedError` |

`maxRetries` defaults to `2` (Ollama: `1`). Override per provider:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: 5
  })
});
```

## Chunk failure

When an error escapes retries (or fires from a non-retryable type), yapyak catches it at the chunk boundary. The whole chunk's translations are lost, the surrounding chunks complete normally, and the failure is reported as [`YAP0033`](/reference/diagnostics/YAP0033). A chunk is `batchSize` items, so a safety block on one item drops the rest of that chunk's translations with it.

The translator never throws back to your application code. Chunk failures surface through the diagnostic stream; the dev-time loop continues with whatever completed.

## Per-entry shape failure

[`YAP0034`](/reference/diagnostics/YAP0034) is the narrower diagnostic. It fires when the response is a valid array but an individual entry has the wrong shape — a string, `null`, or an array instead of an object keyed by target locales. The bad entry's translations are left empty and the rest of the chunk's entries are written normally.

This is distinct from a chunk failure: the response was parseable, the array length matched, only one entry was malformed.

Both diagnostics surface through the same stream as parse and ICU errors. See [Diagnostics](/reference/diagnostics).

## Throwing from a custom translator

A [custom translator](/guide/advanced/custom-translator) should throw the matching error type so the failure surfaces with a clear, consistent message. See [Custom](/guide/advanced/custom-translator#errors-to-throw) for the patterns.

Any other error that escapes the callback — a plain `Error`, an exception from your fetch client — fails the whole chunk and surfaces as [`YAP0033`](/reference/diagnostics/YAP0033). yapyak doesn't retry custom-translator callbacks.
