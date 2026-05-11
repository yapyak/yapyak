# Gemini

Use Google's Gemini models as your translator. Gemini's strength: cost-effective multilingual translation with native handling of non-Latin scripts (Japanese, Korean, Arabic, Hebrew).

```ts
import { yapyak } from 'yapyak/vite';
import { gemini } from 'yapyak/translators/gemini';

yapyak({
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
})
```

Get an API key at [aistudio.google.com](https://aistudio.google.com).

## Options

```ts
interface GeminiOptions {
  apiKey: string;
  voice?: string;
  glossary?: Record<string, Record<string, string>>;
  context?: 'none' | 'minimal' | 'rich';
  batchSize?: number;
  model?: string;
  temperature?: number;
  endpoint?: string;
  headers?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | — | Required. Set via `.env.local` (`GEMINI_API_KEY`). |
| `voice` | — | Tone prompt. |
| `glossary` | — | Forced translations per locale. |
| `context` | `'minimal'` | How much call-site context to send. |
| `batchSize` | `10` | Strings per HTTP request. |
| `model` | `'gemini-2.5-flash'` | Any Gemini model. `gemini-2.5-pro` for higher quality. |
| `temperature` | `0.2` | Low = deterministic. |
| `endpoint` | `'https://generativelanguage.googleapis.com/v1beta'` | Base URL — model name is appended automatically. |
| `headers` | — | Extra HTTP headers. |
| `timeout` | `30_000` | Per-request timeout in milliseconds. |
| `maxRetries` | `2` | Retries on 408/429/5xx + network errors. |

## Picking a model

Google's Gemini lineup:

| Model | Best for | Approx. price | When to use |
| --- | --- | --- | --- |
| `gemini-2.5-pro` | High-quality nuanced copy | $1.25 in / $10 out per 1M | Marketing-critical translation |
| `gemini-2.5-flash` (default) | UI translation | $0.30 in / $2.50 out per 1M | The 99% case |
| `gemini-2.5-flash-lite` | High-volume, low-stakes | $0.10 in / $0.40 out per 1M | Internal tooling, very large catalogs |

For yapyak's typical workload, **`gemini-2.5-flash` is the right default** — comparable quality to `gpt-5-mini` at similar price.

## Why Gemini for translation

Gemini was trained on Google's translation pipeline (Google Translate underpinning). Empirically strong on:

- **Non-Latin scripts** — better Japanese/Korean/Arabic/Hebrew output than English-first models
- **Idiom handling** — especially Asian language idioms
- **Multilingual context** — translating idiomatic English into target locales where literal translation fails

For UI translation projects with significant non-Latin-script coverage, Gemini often produces more natural output than Claude or GPT, at lower cost.

## Authentication

Gemini uses the `x-goog-api-key` header for auth. yapyak handles this internally — you only set `apiKey`.

Older Gemini SDKs use `?key=…` query parameter; yapyak uses the header form (cleaner, doesn't leak the key in URL logs).

## SSR builds and CI

Same pattern as Anthropic. See [Anthropic / SSR builds and CI](/guide/translators/anthropic#ssr-builds-and-ci).

## Vertex AI

Google's enterprise Gemini offering (Vertex AI) uses a different endpoint and auth scheme (OAuth2 / Application Default Credentials). yapyak's `gemini()` translator uses the consumer Gemini API (`generativelanguage.googleapis.com`). For Vertex AI, build a [custom translator](/guide/translators/custom).
