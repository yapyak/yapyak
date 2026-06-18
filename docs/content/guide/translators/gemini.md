---
title: Gemini
order: 4
---

`@yapyak/gemini` is the yapyak translator for [Google's Gemini](https://ai.google.dev/gemini-api/docs). It uses Google's public endpoint by default; you can point it at a Vertex AI proxy by overriding the endpoint.

## Install

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/gemini
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/gemini
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/gemini
```
{% /when %}
{% /switch %}

## Configure

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { gemini } from '@yapyak/gemini';

export default defineConfig({
  translator: gemini({ apiKey: process.env.GEMINI_API_KEY }),
});
```

With voice and glossary:

```ts
translator: gemini({
  apiKey: process.env.GEMINI_API_KEY,
  glossary: {
    Cart: {
      sv: 'Korg',
      de: 'Warenkorb',
    },
  },
  model: 'gemini-2.5-flash',
  voice: 'Concise and friendly',
}),
```

## Options

Gemini-specific options on top of the [shared translator surface](/guide/translators/overview#what-every-translator-shares):

| Option | Type | Default | Purpose |
|---|---|---|---|
| `apiKey` | `string` | required | Your Gemini API key (sent as `x-goog-api-key`) |
| `model` | `string` | `'gemini-2.5-flash'` | Gemini model ID |
| `endpoint` | `string` | `'https://generativelanguage.googleapis.com/v1beta'` | API base URL |
| `temperature` | `number` | `0.2` | Sampling temperature |
| `timeout` | `number` (ms) | `30_000` | Per-request timeout |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx |
| `maxTokens` | `number` | scaled, max 8,000 | Output token cap (sent as `generationConfig.maxOutputTokens`) |
| `batchSize` | `number` | `15` | Source strings per request (lower than other providers) |

{% callout variant="info" %}
Gemini's default batch size is lower than the shared default of 25, since Gemini's context window for translation tasks is smaller in practice. You can raise it if your strings are short, or lower it further if your sources average long messages.
{% /callout %}

## Models

The default `'gemini-2.5-flash'` is the fast, cost-effective Flash tier — well-suited to translation. Heavier work that needs more nuance can use a Pro model:

```ts
translator: gemini({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.5-pro',
}),
```

The full list of available Gemini models lives in [Google's docs](https://ai.google.dev/gemini-api/docs/models).

## Vertex AI

If you're on Google Cloud and routing through Vertex AI rather than the public Gemini endpoint, override the `endpoint` to point at your Vertex AI URL. The path structure differs slightly from the public API — yapyak constructs the full URL as `${endpoint}/models/${model}:generateContent`, so configure your endpoint to match.

```ts
translator: gemini({
  apiKey: process.env.VERTEX_AI_TOKEN,  // Vertex AI uses bearer auth differently
  endpoint: 'https://<region>-aiplatform.googleapis.com/v1/projects/<project>/locations/<region>/publishers/google',
  model: 'gemini-2.5-flash',
}),
```

For production Vertex AI use, you'll typically front this with a service-account auth layer that injects the right token. Pass that token through `apiKey`, or supply your own auth via the `headers` option (which merges into every request).

## Errors

Gemini-specific failure modes map to yapyak's standard [translator errors](/guide/translators/overview#what-yapyak-protects-you-from):

- A `finishReason: 'SAFETY'` or `finishReason: 'RECITATION'` maps to `TranslatorSafetyError` — the safety layer blocked the response.
- A `finishReason: 'MAX_TOKENS'` maps to `TranslatorTruncatedError` — the output hit the cap.
- Auth failures (`401`) raise `TranslatorAuthError`.

All errors extend `TranslatorError` from `yapyak/translator`.
