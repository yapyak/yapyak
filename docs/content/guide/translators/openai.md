---
title: OpenAI
order: 5
---

## Install

```bash
npm install @yapyak/openai
# or
pnpm add @yapyak/openai
```

## Setup

Use OpenAI's GPT models — or any OpenAI-compatible provider (Groq, DeepSeek, Mistral, OpenRouter, Vercel AI Gateway, Together AI) — as your translator.

```ts
// yapyak.config.ts
import type { YapyakConfig } from 'yapyak';
import { openai } from '@yapyak/openai';

export default {
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
} satisfies YapyakConfig;
```

Get an API key at [platform.openai.com](https://platform.openai.com).

## Options

```ts
interface OpenAIOptions {
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
  organization?: string;
  seed?: number;
  user?: string;
}
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | — | Required. |
| `model` | `'gpt-5-mini'` | Any OpenAI model. |
| `endpoint` | `'https://api.openai.com/v1/chat/completions'` | Override for any OpenAI-compatible provider. |
| `organization` | — | Sets `OpenAI-Organization` header for multi-org accounts. |
| `seed` | — | Reproducible outputs. Same `(prompt, seed)` gives the same result. |
| `user` | — | End-user tracking string, included in request payload. |

See [Shared options](/guide/translators#shared-options) for `voice`, `glossary`, `context`, `batchSize`, `temperature`, `headers`, `timeout`, `maxRetries`.

## OpenAI-compatible providers

Many providers expose OpenAI-compatible endpoints — Groq, DeepSeek, Mistral, OpenRouter, Together AI, Vercel AI Gateway, Ollama (compat mode). Use this translator with their endpoint and the right model name:

```ts
openai({
  apiKey: process.env.GROQ_API_KEY!,
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.1-70b-versatile',
})
```

For native Ollama integration, prefer the [`ollama` translator](/guide/translators/ollama).

## Seed example

For deterministic translation in tests:

```ts
openai({
  apiKey: process.env.OPENAI_API_KEY!,
  seed: 42,
})
```

Same source string + same seed = same output every run. Useful for snapshot testing the translation pipeline.

OpenAI doesn't guarantee strict determinism (model updates can shift output even with seed), but in practice it's stable.

## Organization

For users with multiple OpenAI organizations on a single account:

```ts
openai({
  apiKey: process.env.OPENAI_API_KEY!,
  organization: 'org-acme-prod',
})
```

Sent as the `OpenAI-Organization` HTTP header.
