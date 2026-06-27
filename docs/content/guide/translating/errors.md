---
title: Errors
order: 10
---

Translator failures surface as typed errors from `yapyak/translator`. `TranslatorError` is the base; the seven specific types extend it.

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
| `TranslatorAuthError` | HTTP 401 or 403. Bad or missing API key. | `vendor` |
| `TranslatorRateLimitError` | HTTP 429. Provider rate limit. | `vendor`, `retryAfter` (ms) when the provider sent one |
| `TranslatorTimeoutError` | Request exceeded `timeout` or was aborted. | `vendor` |
| `TranslatorNetworkError` | Other HTTP failures and network errors. | `vendor`, `status` when known |
| `TranslatorSafetyError` | Provider blocked content. Anthropic refusal, OpenAI content filter, Gemini SAFETY or RECITATION. | `vendor` |
| `TranslatorInvalidResponseError` | Model returned something that doesn't parse. | `vendor` |
| `TranslatorTruncatedError` | Model output was cut off by the token limit. | `vendor` |

All seven extend `TranslatorError`, so one `catch (cause instanceof TranslatorError)` handles every case.

## Retry behavior

Retries happen inside the provider before an error escapes. Three error types are retryable; the rest fail fast.

| Type | Retried? |
|---|---|
| `TranslatorRateLimitError` | Yes. Backoff up to `maxRetries`. Honors `retryAfter` when present. |
| `TranslatorTimeoutError` | Yes. Up to `maxRetries`. |
| `TranslatorNetworkError` | Yes. Up to `maxRetries`. |
| `TranslatorAuthError` | No. Retries don't help a bad key. |
| `TranslatorSafetyError` | No. The block is a verdict, not a transient. |
| `TranslatorInvalidResponseError` | No. |
| `TranslatorTruncatedError` | No. |

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

When an error escapes retries (or fires from a non-retryable type), yapyak catches it at the chunk boundary. The whole chunk's translations are lost; the surrounding chunks complete normally; the failure surfaces as [`YAP0033`](/reference/diagnostics/YAP0033).

{% callout variant="warning" %}
A chunk is `batchSize` items. A safety block on one item drops the rest of that chunk's translations along with it. The partial result is what survives.
{% /callout %}

The translator never throws back to your application code. Chunk failures are reported through the diagnostic stream and the dev-time loop continues with whatever completed.

## Per-entry shape failure

[`YAP0034`](/reference/diagnostics/YAP0034) is the narrower diagnostic. It fires when the response is a valid array but an individual entry has the wrong shape — a string or `null` instead of an object keyed by target locales. The bad entry's translations are left empty and the rest of the chunk's entries are written normally.

This is distinct from a chunk failure: the response was parseable, the array length matched, only one entry was malformed.

Both diagnostics surface through the same stream as parse and ICU errors. See [Diagnostics](/reference/diagnostics).

## Throwing from a custom translator

A [custom translator](/guide/translating/custom) should throw the matching error type so yapyak applies the right behavior. See [Custom](/guide/translating/custom#errors-to-throw) for the patterns.

A plain `Error` thrown from a custom translator is treated as a `TranslatorNetworkError` and gets the default retry policy.
