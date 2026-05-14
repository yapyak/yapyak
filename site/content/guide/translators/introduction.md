---
title: Introduction
order: 1
---

A **translator** is the function yapyak calls to actually translate strings. The plugin extracts `t()` calls, batches them, and passes them to the configured translator. The translator makes the HTTP call to an AI provider and returns the translations.

yapyak ships four translators out of the box: **Anthropic**, **OpenAI**, **Gemini**, and **Ollama**. Each is a thin wrapper over `createTranslator` — open the source, it's ~100 lines.

```ts
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translator/anthropic';

yapyak({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
})
```

## Which one to pick

| You want… | Use |
| --- | --- |
| Best translation quality for UI copy | [Anthropic](/guide/translators/anthropic) (Claude Sonnet) |
| Broadest model selection, ecosystem familiarity | [OpenAI](/guide/translators/openai) (GPT) |
| Cheap + native multilingual strength | [Gemini](/guide/translators/gemini) (Flash) |
| Local, free, no API key, privacy-strict | [Ollama](/guide/translators/ollama) (Llama 3.1, DeepSeek-R1, etc.) |
| Something else (Groq, DeepSeek, Mistral, OpenRouter, Vercel AI Gateway) | [OpenAI](/guide/translators/openai) with custom `endpoint` |
| Your own service or model | [Custom](/guide/translators/custom) via `createTranslator` |

## Cost & speed at a glance

| Translator | Default model | ~Price per 1M tokens | Speed |
| --- | --- | --- | --- |
| Anthropic | `claude-sonnet-4-6` | $3 in / $15 out | Standard |
| OpenAI | `gpt-5-mini` | $0.30 in / $2.40 out | Standard |
| Gemini | `gemini-2.5-flash` | $0.30 in / $2.50 out | Fast |
| Ollama | `llama3.1` | Free (your hardware) | Variable (depends on GPU) |

For typical UI translation projects, AI cost is in the cents-per-week range across any provider. Pick based on quality / privacy / brand fit rather than cost.

## Shared options

Every shipped translator accepts the same core options:

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `voice` | `string` | — | Tone prompt prepended to every translation request |
| `glossary` | `Record<string, Record<string, string>>` | — | Forced translations per locale for specific source terms |
| `context` | `'none' \| 'minimal' \| 'rich'` | `'minimal'` | How much call-site context to send to the AI |
| `batchSize` | `number` | `10` | Strings translated per request |
| `model` | `string` | provider-specific | Which model to use |
| `temperature` | `number` | `0.2` | Randomness of output (low = deterministic) |
| `endpoint` | `string` | provider-specific | HTTP endpoint override |
| `headers` | `Record<string, string>` | — | Extra request headers |
| `timeout` | `number` | `30_000` ms | Per-request timeout |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx and network errors |

Provider-specific options on top:

- **Anthropic**: `apiKey` (required)
- **OpenAI**: `apiKey` (required), `organization`, `seed`, `user`
- **Gemini**: `apiKey` (required)
- **Ollama**: no `apiKey` — local

See each provider's page for full details.

## Translation context

`context` controls how much information about each `t()` call site gets sent to the AI:

| Level | Sends | Use when |
| --- | --- | --- |
| `'none'` | Just the source string | Privacy-strict; you don't want surrounding code shipped to AI |
| `'minimal'` (default) | + component name + enclosing JSX element | Default — gives the AI enough to disambiguate without source code |
| `'rich'` | + ±3 lines of surrounding source code | Maximum quality for nuanced UI copy |

For most UI translation, `'minimal'` is the sweet spot — disambiguation without leakage. `'rich'` helps for translations where layout matters (e.g. a tooltip needs to fit a specific width). `'none'` is for teams that can't ship code samples to third-party AI.

## Voice

Set the tone for every translation:

```ts
anthropic({
  apiKey: '…',
  voice: 'Personal blog voice. Casual, thoughtful, never corporate. Match the original cadence.',
})
```

The voice string is prepended to every translation prompt. Consistent across saves, locales, and `--force` runs.

## Glossary

Force specific translations for terms that must always render the same way:

```ts
anthropic({
  apiKey: '…',
  glossary: {
    'sign in': { sv: 'logga in', no: 'logg inn', dk: 'log ind' },
    'cart': { es: 'carrito', fr: 'panier', de: 'Warenkorb' },
  },
})
```

When the AI sees a source string containing a glossary key, it's instructed to use the configured translation. Useful for brand terms, regulated language (legal, medical), or product-specific vocabulary.

## Reliability

`maxRetries` and `timeout` give you robust translation even on flaky networks or rate-limited APIs:

```ts
anthropic({
  apiKey: '…',
  timeout: 60_000,     // wait longer for slow networks
  maxRetries: 5,       // try harder before giving up
})
```

Retries trigger on 408 / 429 / 5xx HTTP statuses and on network-level errors, with exponential backoff (250ms, 500ms, 1s, 2s, 4s, capped at 8s). 4xx errors other than 408/429 bubble up immediately (they're not transient).

## Bring your own

Any LLM provider or service can be a yapyak translator. See [Custom](/guide/translators/custom) for the `createTranslator` API.
