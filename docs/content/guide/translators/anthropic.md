---
title: Anthropic
order: 2
---

`@yapyak/anthropic` is the yapyak translator for [Anthropic's Claude](https://docs.anthropic.com).

## Install

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/anthropic
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/anthropic
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/anthropic
```
{% /when %}
{% /switch %}

## Configure

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
});
```

That's the minimum. A full setup with voice and glossary:

```ts
translator: anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  voice: 'Concise and friendly',
  glossary: {
    Cart: { sv: 'Korg', de: 'Warenkorb' },
    Checkout: { sv: 'Kassa', de: 'Kasse' },
  },
}),
```

## Options

Anthropic-specific options on top of the [shared translator surface](/guide/translators/overview#what-every-translator-shares):

| Option | Type | Default | Purpose |
|---|---|---|---|
| `apiKey` | `string` | required | Your Anthropic API key |
| `model` | `string` | `'claude-sonnet-4-6'` | Claude model ID |
| `endpoint` | `string` | `'https://api.anthropic.com/v1/messages'` | Override for proxies |
| `temperature` | `number` | `0.2` | Sampling temperature |
| `timeout` | `number` (ms) | `30_000` | Per-request timeout |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx |
| `maxTokens` | `number` | scaled, max 32,000 | Output token cap |

For voice, glossary, context, batchSize, concurrency, and headers, see [Overview — What every translator shares](/guide/translators/overview#what-every-translator-shares).

## Models

The default `'claude-sonnet-4-6'` is the recommended Sonnet for general translation work — accurate, fast, and middle-priced. The full list of available Claude models lives in [Anthropic's docs](https://docs.anthropic.com/claude/docs/models-overview). You'd reach for a different one when:

- **Heavier nuance, brand-critical copy** — Opus
- **Bulk throughput, cost-conscious runs** — Haiku
- **Pinning a specific version for reproducibility** — an explicit dated model identifier

```ts
translator: anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-opus-4-8',
}),
```

## Voice examples

Anthropic models are receptive to detailed voice instructions. Some patterns that work well:

```ts
voice: 'Direct and warm — like writing for a small SaaS team product. Avoid corporate language.',
voice: 'Formal legal language, suitable for terms-of-service text.',
voice: 'Conversational, slightly playful. We use first-person plural ("we", "us").',
```

Keep it under two sentences. Long instructions tend to make the model second-guess routine choices.

## Cost and rate limits

Anthropic charges by input + output token. yapyak's defaults — batch size 25, concurrency 5, temperature 0.2 — keep cost predictable. Three knobs are worth knowing about:

- **`batchSize`** controls how many source strings ride along in one request. Larger batches mean fewer requests (cheaper per-token) but larger output payloads.
- **`concurrency`** controls how many requests run in parallel. Higher concurrency means faster total time on big translation runs, at the cost of getting closer to your rate limit.
- **`context`** at `'rich'` sends more source code to the model per string. Useful for tricky disambiguation; more tokens per request.

A 429 rate-limit response is parsed automatically — yapyak retries with backoff based on the `Retry-After` header. If you keep hitting them, lower `concurrency` first.

{% callout variant="tip" %}
For large initial translation runs (filling in thousands of strings the first time you set up yapyak), consider running [`yapyak translate`](/guide/cli/translate) from your terminal rather than relying on the dev-time save loop. The CLI lets you cap concurrency and shows progress, which is friendlier than seeing translations dribble into your editor over five minutes.
{% /callout %}

## Errors

Anthropic-specific failure modes map to yapyak's standard [translator errors](/guide/translators/overview#what-yapyak-protects-you-from):

- A `stop_reason: 'refusal'` from Claude maps to `TranslatorSafetyError` — the model declined to translate a string for safety reasons. Rare in practice; usually triggered by content the model considers harmful.
- A `stop_reason: 'max_tokens'` maps to `TranslatorTruncatedError` — the model hit the output budget. Raise `maxTokens`, or split the batch.
- Auth failures (`401`) raise `TranslatorAuthError`.

All translator errors extend `TranslatorError` from `yapyak/translator`, so one `catch` handles everything.
