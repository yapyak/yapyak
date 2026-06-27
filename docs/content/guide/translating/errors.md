---
title: Errors
order: 10
---

Translator failures surface as typed errors from `yapyak/translator`. yapyak catches them, applies the right retry behavior per type, and reports failures that survive retries as YAP diagnostics.

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

`TranslatorError` is the base class. The seven specific types extend it.

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

yapyak applies a different retry policy per error type:

- **`TranslatorRateLimitError`.** Backoff and retry up to `maxRetries`. Honors `retryAfter` when present.
- **`TranslatorTimeoutError`, `TranslatorNetworkError`.** Retry up to `maxRetries`.
- **`TranslatorAuthError`.** Fail fast. Retries don't help a bad key.
- **`TranslatorSafetyError`.** Skip the offending item, continue with the rest of the batch.
- **`TranslatorInvalidResponseError`, `TranslatorTruncatedError`.** Surface as `YAP0034` and drop the affected entries.

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

## The two diagnostics

Failures that survive retries become YAP diagnostics so the dev-time loop and CI runs report them the same way.

- [`YAP0033`](/reference/diagnostics/YAP0033). A batch chunk failed after retries. yapyak kept the other chunks and returned partial results.
- [`YAP0034`](/reference/diagnostics/YAP0034). The translator returned a result entry with the wrong shape. The entry was dropped and its translations were left empty.

Both are surfaced through the same diagnostic stream as parse and ICU errors. See [Diagnostics](/reference/diagnostics).

## Throwing from a custom translator

A [custom translator](/guide/translating/custom) should throw the matching error type so yapyak applies the right behavior. See [Custom](/guide/translating/custom#errors-to-throw) for the patterns.

A plain `Error` thrown from a custom translator is treated as a `TranslatorNetworkError` and gets the default retry policy.
