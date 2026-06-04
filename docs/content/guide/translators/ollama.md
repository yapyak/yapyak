---
title: Ollama
order: 4
---

## Install

{% code-group %}

```bash [npm]
npm install @yapyak/ollama
```

```bash [pnpm]
pnpm add @yapyak/ollama
```

```bash [bun]
bun add @yapyak/ollama
```

{% /code-group %}

## Setup

Run translation locally — no API key, no vendor in your billing path, no data leaving your machine.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';

export default defineConfig({
  translator: ollama({
    voice: 'Casual, thoughtful, never corporate.',
  }),
});
```

Install Ollama from [ollama.com](https://ollama.com), pull a model (`ollama pull llama3.1`), and you're done.

## Options

```ts
interface OllamaOptions {
  voice?: string;
  glossary?: Record<string, Record<string, string>>;
  context?: 'none' | 'minimal' | 'rich';
  batchSize?: number;
  concurrency?: number;
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
| `model` | `'llama3.1'` | Any model in your local Ollama library. |
| `endpoint` | `'http://localhost:11434/api/generate'` | Override for remote Ollama servers. |
| `timeout` | `120_000` | Higher than cloud — local inference is slower. |
| `maxRetries` | `1` | Lower than cloud — local network rarely needs retries. |

No `apiKey`. Ollama runs locally without auth.

See [Shared options](/guide/translators#shared-options) for `voice`, `glossary`, `context`, `batchSize`, `concurrency`, `temperature`, `headers`.

## Picking a model

Pull the model you want first:

```bash
ollama pull llama3.1
```

Then point yapyak at it:

```ts
ollama({ model: 'qwen3:32b' })
```

## Remote Ollama

Running Ollama on a different machine (e.g. a homelab GPU server, work workstation)?

```ts
ollama({
  endpoint: 'http://gpu-server.local:11434/api/generate',
  model: 'llama3.1:70b',
})
```

For TLS / auth (custom reverse proxy):

```ts
ollama({
  endpoint: 'https://ai.example.com/ollama/api/generate',
  headers: {
    authorization: `Bearer ${process.env.OLLAMA_TOKEN}`,
  },
})
```

## Local + cloud fallback (advanced)

For development: local Ollama. For production builds: cloud (Anthropic/OpenAI). Branch on `NODE_ENV`:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { ollama } from '@yapyak/ollama';

const translator = process.env.NODE_ENV === 'production'
  ? anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      voice: '...',
    })
  : ollama({
      model: 'llama3.1',
      voice: '...',
    });

export default defineConfig({ translator });
```

You'll see slight tone differences between local and cloud translations. Stick to one in production for consistency.

## Privacy guarantees

Ollama runs entirely on your machine. No data leaves your network. yapyak's translator makes HTTP requests only to `localhost:11434` (or wherever you configured `endpoint`). For privacy-strict teams (legal, medical, defense), this is the only AI translation flow that satisfies compliance without negotiating with a vendor.

If you also want call-site code excluded from prompts (just in case), use `context: 'none'`:

```ts
ollama({
  model: 'llama3.1',
  context: 'none',
})
```

Then only the source string itself is sent to the model — no component names, no surrounding code, no element hints.
