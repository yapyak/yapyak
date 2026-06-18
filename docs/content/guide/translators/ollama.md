---
title: Ollama
order: 5
---

`@yapyak/ollama` is the yapyak translator for [Ollama](https://ollama.com) — local inference, no API key, no provider account, no requests leaving your machine. Useful for privacy-sensitive projects, air-gapped environments, or development setups where you'd rather not burn through an API quota.

## Install

You'll need [Ollama itself](https://ollama.com/download) installed and running, then the binding:

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/ollama
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/ollama
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/ollama
```
{% /when %}
{% /switch %}

Pull a model that fits your machine. For translation, a 7B–8B model is usually fast enough:

```bash
ollama pull llama3.1
```

## Configure

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';

export default defineConfig({
  translator: ollama(),
});
```

No `apiKey`. To override the default model or pass a voice:

```ts
translator: ollama({
  model: 'qwen2.5',
  voice: 'Concise and friendly',
}),
```

## Options

Ollama-specific options on top of the [shared translator surface](/guide/translators/overview#what-every-translator-shares):

| Option | Type | Default | Purpose |
|---|---|---|---|
| `endpoint` | `string` | `'http://localhost:11434/api/generate'` | Ollama server URL |
| `model` | `string` | `'llama3.1'` | Ollama model ID |
| `temperature` | `number` | `0.2` | Sampling temperature |
| `timeout` | `number` (ms) | `120_000` | Per-request timeout (longer than hosted providers) |
| `maxRetries` | `number` | `1` | Retries on 408/429/5xx |
| `maxTokens` | `number` | scaled, max 4,000 | Output token cap (sent as `options.num_predict`) |
| `batchSize` | `number` | `8` | Source strings per request (smaller for local inference) |

{% callout variant="info" %}
Ollama's defaults reflect what local inference costs: longer timeouts (models take longer than hosted APIs), smaller batches (limited GPU memory), fewer retries (a failure is more likely to be permanent — wrong model name, server not running — than transient).
{% /callout %}

## Picking a model

Translation quality varies hugely across local models. A few rules of thumb:

- **`llama3.1` (8B)** — yapyak's default. Good general balance for English-source translations.
- **`qwen2.5` (7B / 14B)** — strong for non-Latin scripts (Chinese, Japanese, Korean).
- **`mistral` (7B)** — strong for European languages.
- **`gemma3` (12B / 27B)** — newer model, strong general performance.
- **`phi4-mini` (4B)** — useful when memory is tight.
- Anything below ~3B is probably too small for production-quality translation.

You'll need to download whichever model you pick (`ollama pull <model>`). Bigger models give better translations but need more RAM and run slower.

## Remote Ollama

You can point at a remote Ollama instance — useful for a shared internal server, or for using a beefier machine than your laptop:

```ts
translator: ollama({
  endpoint: 'http://ollama-server.internal:11434/api/generate',
  model: 'qwen2.5:14b',
  timeout: 300_000,  // raise for slower-shared instances
}),
```

If the remote Ollama is behind a proxy that needs auth, use the `headers` option to add whatever your gateway expects:

```ts
translator: ollama({
  endpoint: 'https://ollama-gateway.example.com/api/generate',
  headers: { Authorization: `Bearer ${process.env.GATEWAY_TOKEN}` },
}),
```

## Privacy guarantees

Ollama runs locally (or on hardware you control). yapyak makes no requests anywhere else when configured with the Ollama translator — every source string goes from your machine, to your Ollama instance, and back. No hosted API receives the text.

If you're using yapyak in a privacy-sensitive setting and the privacy claim matters formally, two things to watch:

- **Don't leak through other channels.** The translator translates; the rest of yapyak (compiler, runtime) doesn't make network requests either. But if you've added telemetry, error reporting, or other instrumentation elsewhere, those are separate channels.
- **Verify the endpoint.** A `http://...` URL doesn't encrypt traffic. For internal-network Ollama, that's usually fine; for anything crossing the public internet, route through a TLS-terminating reverse proxy or use `https://...` directly.

## Falling back to a cloud provider

A common pattern: use Ollama locally during development for fast iteration, but switch to a hosted provider in CI for higher quality. The translator is just a field in `yapyak.config.ts`, so you can branch on an environment variable:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';
import { anthropic } from '@yapyak/anthropic';

const translator = process.env.CI
  ? anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : ollama();

export default defineConfig({
  translator,
});
```

Translations made by either provider are stored in the same locale files; the next time the other runs, it sees them as already done.

## Errors

Ollama-specific failure modes map to yapyak's standard [translator errors](/guide/translators/overview#what-yapyak-protects-you-from):

- A `done_reason: 'length'` maps to `TranslatorTruncatedError` — the output hit the token cap.
- A failed fetch (server not running, wrong endpoint, refused connection) raises `TranslatorNetworkError`.
- A timeout (slow inference, model loading) raises `TranslatorTimeoutError`.

All errors extend `TranslatorError` from `yapyak/translator`.
