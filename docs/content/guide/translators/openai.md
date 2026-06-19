---
title: OpenAI
order: 3
---

`@yapyak/openai` is the yapyak translator for [OpenAI](https://platform.openai.com) and OpenAI-compatible providers. The same package works with Azure OpenAI, Groq, Mistral, DeepSeek, OpenRouter, and a growing number of others — override the endpoint and you're set.

## Install

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/openai
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/openai
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/openai
```
{% /when %}
{% /switch %}

## Configure

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';

export default defineConfig({
  translator: openai({ apiKey: process.env.OPENAI_API_KEY }),
});
```

With voice and glossary:

```ts
translator: openai({
  apiKey: process.env.OPENAI_API_KEY,
  glossary: {
    Cart: {
      sv: 'Korg',
      de: 'Warenkorb',
    },
  },
  model: 'gpt-5-mini',
  voice: 'Concise and friendly',
}),
```

## Options

OpenAI-specific options on top of the [shared translator surface](/guide/translators/overview#what-every-translator-shares):

| Option | Type | Default | Purpose |
|---|---|---|---|
| `apiKey` | `string` | required | Your OpenAI API key (or compatible-provider key) |
| `model` | `string` | `'gpt-5-mini'` | Model ID |
| `endpoint` | `string` | `'https://api.openai.com/v1/chat/completions'` | Override for compatible providers |
| `organization` | `string` | undefined | Sent as `OpenAI-Organization` header |
| `seed` | `number` | undefined | Deterministic seed (reproducible output) |
| `user` | `string` | undefined | Stable end-user identifier for abuse tracking |
| `temperature` | `number` | `0.2` | Sampling temperature (ignored by reasoning models) |
| `timeout` | `number` (ms) | `30_000` | Per-request timeout |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx |
| `maxTokens` | `number` | scaled, max 16,000 | Output token cap |

## Compatible providers

The same `openai()` factory works with any provider that mirrors OpenAI's chat-completions schema. Override `endpoint` and you're set.

Groq:

```ts
openai({
  apiKey: process.env.GROQ_API_KEY,
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.1-70b-versatile',
});
```

DeepSeek:

```ts
openai({
  apiKey: process.env.DEEPSEEK_API_KEY,
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
});
```

Mistral:

```ts
openai({
  apiKey: process.env.MISTRAL_API_KEY,
  endpoint: 'https://api.mistral.ai/v1/chat/completions',
  model: 'mistral-large-latest',
});
```

OpenRouter (aggregator):

```ts
openai({
  apiKey: process.env.OPENROUTER_API_KEY,
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'anthropic/claude-sonnet-4-6',
});
```

Each provider has its own model names and rate-limit shapes. yapyak's retry behavior (408/429/5xx with exponential backoff) is provider-agnostic.

## Reasoning models

OpenAI's reasoning models (the `gpt-5*` and `o1-*` family) handle a couple of fields differently:

- **`max_completion_tokens`** is sent instead of `max_tokens`. yapyak switches automatically based on the model name; you don't have to think about it.
- **`temperature`** is ignored by the provider. If you set it, it's quietly dropped by the API. Reasoning models have their own internal sampling.

For translation, reasoning models are slower per request but tend to handle subtle disambiguation better. For bulk translation runs, the non-reasoning models (`gpt-5-mini` is the default) are usually a better fit.

## Reproducible output

The `seed` parameter pins the model's sampling, so the same input produces the same output. Useful for:

- **CI pipelines** that translate on every build and need stable results
- **Diff-checking translations** when comparing two runs
- **Debugging** a single weird translation deterministically

```ts
translator: openai({
  apiKey: process.env.OPENAI_API_KEY,
  seed: 42,
}),
```

The seed isn't a strict guarantee — OpenAI documents it as "best-effort". In practice it works for the vast majority of translation runs.

## Abuse tracking with `user`

The `user` field passes through a stable identifier per end-user, used by OpenAI's abuse-detection systems. For yapyak's use case (you're calling the API from your build, not on behalf of end-users), pass a stable identifier for the project or the operator, not a per-user value:

```ts
user: process.env.YAPYAK_OPERATOR_ID ?? 'yapyak-build',
```

## Errors

OpenAI-specific failure modes map to yapyak's standard [translator errors](/guide/translators/overview#what-yapyak-protects-you-from):

- A `finish_reason: 'content_filter'` maps to `TranslatorSafetyError` — the moderation layer blocked the response.
- A `finish_reason: 'length'` maps to `TranslatorTruncatedError` — the output hit the token cap.
- Auth failures (`401`) raise `TranslatorAuthError`.

All errors extend `TranslatorError` from `yapyak/translator`.
