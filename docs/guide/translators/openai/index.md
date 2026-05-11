# OpenAI

Use OpenAI's GPT models — or any OpenAI-compatible provider (Groq, DeepSeek, Mistral, OpenRouter, Vercel AI Gateway, Together AI) — as your translator.

```ts
import { yapyak } from 'yapyak/vite';
import { openai } from 'yapyak/translators/openai';

yapyak({
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
})
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
| `apiKey` | — | Required. Set via `.env.local` (`OPENAI_API_KEY`). |
| `voice` | — | Tone prompt. See [overview](/guide/translators/#voice). |
| `glossary` | — | Forced translations per locale. See [overview](/guide/translators/#glossary). |
| `context` | `'minimal'` | How much call-site context to send. |
| `batchSize` | `10` | Strings per HTTP request. |
| `model` | `'gpt-5-mini'` | Any OpenAI model — `gpt-5` for higher quality, `gpt-5-mini` for cost. |
| `temperature` | `0.2` | Low = deterministic. |
| `endpoint` | `'https://api.openai.com/v1/chat/completions'` | Override for any OpenAI-compatible provider. |
| `headers` | — | Extra HTTP headers. |
| `timeout` | `30_000` | Per-request timeout in milliseconds. |
| `maxRetries` | `2` | Retries on 408/429/5xx + network errors. |
| `organization` | — | Sets `OpenAI-Organization` header for multi-org accounts. |
| `seed` | — | Reproducible outputs. Same `(prompt, seed)` gives the same result. |
| `user` | — | End-user tracking string, included in request payload. |

## Use as a universal compatibility layer

Many AI providers expose **OpenAI-compatible endpoints**. You can use them through this translator by overriding `endpoint`.

### Groq (fast inference)

```ts
openai({
  apiKey: process.env.GROQ_API_KEY!,
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.1-70b-versatile',
})
```

### DeepSeek (cheapest quality model)

```ts
openai({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
})
```

### Mistral (European data sovereignty)

```ts
openai({
  apiKey: process.env.MISTRAL_API_KEY!,
  endpoint: 'https://api.mistral.ai/v1/chat/completions',
  model: 'mistral-large-latest',
})
```

### Together AI (open-source models at scale)

```ts
openai({
  apiKey: process.env.TOGETHER_API_KEY!,
  endpoint: 'https://api.together.xyz/v1/chat/completions',
  model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
})
```

### OpenRouter (gateway to 200+ models)

```ts
openai({
  apiKey: process.env.OPENROUTER_API_KEY!,
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'anthropic/claude-sonnet-4',
})
```

### Vercel AI Gateway

```ts
openai({
  apiKey: process.env.VERCEL_AI_TOKEN!,
  endpoint: 'https://gateway.ai.vercel.app/v1/openai/chat/completions',
})
```

### Ollama (local, OpenAI-compat mode)

```ts
openai({
  apiKey: 'ollama',
  endpoint: 'http://localhost:11434/v1/chat/completions',
  model: 'llama3.1',
})
```

For native Ollama integration, prefer [`yapyak/translators/ollama`](/guide/translators/ollama).

## Picking a model

OpenAI's current lineup (May 2026):

| Model | Best for | When to use |
| --- | --- | --- |
| `gpt-5` | Highest-quality translations | Marketing-critical copy |
| `gpt-5-mini` (default) | UI translation | The 99% case |
| `gpt-5-nano` | High-volume cheap | Internal tooling, prototypes |
| `o4-mini` | Reasoning-heavy contexts | Rarely needed for translation |

For yapyak's typical workload, **`gpt-5-mini` is the right default**. It's accurate enough for UI translation and ~10× cheaper than full `gpt-5`.

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

## SSR builds and CI

Same pattern as Anthropic — set `OPENAI_API_KEY` as a CI secret, or pre-translate locally and commit the result. See [Anthropic / SSR builds and CI](/guide/translators/anthropic#ssr-builds-and-ci).
