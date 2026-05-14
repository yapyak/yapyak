---
title: Ollama
order: 5
---


Run translation locally — no API key, no vendor in your billing path, no data leaving your machine.

```ts
import { yapyak } from 'yapyak/vite';
import { ollama } from 'yapyak/translators/ollama';

yapyak({
  translator: ollama({
    voice: 'Casual, thoughtful, never corporate.',
  }),
})
```

Install Ollama from [ollama.com](https://ollama.com), pull a model (`ollama pull llama3.1`), and you're done.

## Options

```ts
interface OllamaOptions {
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
| `voice` | — | See [Voice](/guide/translators/#voice). |
| `glossary` | — | See [Glossary](/guide/translators/#glossary). |
| `context` | `'minimal'` | See [Translation context](/guide/translators/#translation-context). |
| `batchSize` | `10` | Strings per request. Lower for very small models (7B parameters and under). |
| `model` | `'llama3.1'` | Any model in your local Ollama library. |
| `temperature` | `0.2` | Low = deterministic. |
| `endpoint` | `'http://localhost:11434/api/generate'` | Override for remote Ollama servers. |
| `headers` | — | Extra HTTP headers (rarely needed for local). |
| `timeout` | `120_000` | Per-request timeout. Higher default than cloud — local inference is slower. |
| `maxRetries` | `1` | Lower default — local network is reliable, no need for aggressive retries. |

No `apiKey`. Ollama runs locally without auth.

## Picking a model

Ollama runs many models. Translation quality varies a lot by model size:

| Model | Parameters | Translation quality | Notes |
| --- | --- | --- | --- |
| `llama3.1` (default) | 8B | Good | Solid default for European languages |
| `llama3.1:70b` | 70B | Excellent | Approaches Claude/GPT quality; needs ~40GB RAM |
| `qwen3:32b` | 32B | Excellent for Asian languages | Strong on Chinese, Japanese, Korean |
| `gemma3:27b` | 27B | Very good | Google's open model |
| `mistral:7b` | 7B | Good for European | Fast, low memory |
| `deepseek-r1:32b` | 32B | Excellent reasoning | Heavier — better for nuanced translation |

Pull a model before using it:

```bash
ollama pull llama3.1
ollama pull qwen3:32b
```

For most projects on developer hardware (M-series Mac, RTX 4070+), **`llama3.1` (8B) is the default** — runs comfortably in real-time, produces solid UI translations.

If you have the hardware for it, **`llama3.1:70b` or `qwen3:32b` produces noticeably better quality**, especially for non-Latin-script targets.

## Hardware requirements (rough guide)

| Model size | RAM needed | Translation speed (M1 Max) |
| --- | --- | --- |
| 7-8B | 8 GB | ~50 tokens/sec |
| 13B | 16 GB | ~30 tokens/sec |
| 32B | 32 GB | ~10 tokens/sec |
| 70B | 48 GB+ | ~3 tokens/sec |

Translation through yapyak typically generates 100-300 output tokens per batch of 10 strings. A 7B model finishes a batch in ~3 seconds on consumer hardware.

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

```ts
import { anthropic } from 'yapyak/translators/anthropic';
import { ollama } from 'yapyak/translators/ollama';

const translator = process.env.NODE_ENV === 'production'
  ? anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      voice: '…',
    })
  : ollama({
      model: 'llama3.1',
      voice: '…',
    });

yapyak({ translator });
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
