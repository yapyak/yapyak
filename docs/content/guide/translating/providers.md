---
title: Providers
order: 3
---

A translator connects yapyak to a model. yapyak ships four; any other backend is a [custom translator](/guide/advanced/custom-translator) away.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
});
```

## The four

| Provider | Import | Notes |
|---|---|---|
| [Anthropic](/reference/anthropic) | `@yapyak/anthropic` | Claude models. |
| [OpenAI](/reference/openai) | `@yapyak/openai` | GPT and reasoning models. Works with OpenAI-compatible endpoints (Azure, Groq, Mistral, OpenRouter). |
| [Gemini](/reference/gemini) | `@yapyak/gemini` | Google's models. Default batch size 15. |
| [Ollama](/reference/ollama) | `@yapyak/ollama` | Local inference. No API key. Default batch size 8, timeout 120s. |

Each factory takes an `apiKey` (except Ollama) and the [shared options](#shared-options). Provider-specific options live on each [reference page](/reference).

## Shared options

The four factories accept the same option surface. Provider pages add a handful of provider-specific extras (model defaults, vendor headers).

| Option | Type | Default | Purpose |
|---|---|---|---|
| `apiKey` | `string` | required | Provider key (not used by Ollama). |
| `model` | `string` | provider-specific | Model identifier. |
| `voice` | `string` | undefined | Tone guidance for the model. See [Voice](/guide/translating/voice). |
| `glossary` | `Record<string, Record<string, string>>` | `{}` | Pinned source-to-target translations. Inner keys are locale codes. See [Glossary](/guide/translating/glossary). |
| `context` | `'none' \| 'minimal' \| 'rich'` | `'minimal'` | How much call-site code is sent. See [Context](/guide/translating/context). |
| `temperature` | `number` | `0.2` | Sampling temperature. |
| `maxTokens` | `number` | provider-scaled | Output token cap. |
| `timeout` | `number` | `30_000` ms | Per-request timeout. Ollama defaults to `120_000`. |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx. Ollama defaults to `1`. |
| `batchSize` | `number` | `25` | Source strings per request. Gemini `15`, Ollama `8`. |
| `concurrency` | `number` | `5` | Parallel in-flight requests. |
| `headers` | `Record<string, string>` | `{}` | Extra HTTP headers. |
| `endpoint` | `string` | provider URL | Custom API endpoint. |

The three options that reward thought before defaulting: [Voice](/guide/translating/voice), [Glossary](/guide/translating/glossary), and [Context](/guide/translating/context).

## Switching providers

The translator is one config field. To switch, swap the factory and the import. Existing translations stay. `yapyak translate --force` re-runs the new translator over every entry; see [Coverage](/guide/translating/coverage).

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';

export default defineConfig({
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY
  })
});
```
