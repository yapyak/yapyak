---
title: Introduction
order: 1
---

A **translator** is the function yapyak calls to actually translate strings. The plugin extracts `$t()` calls, batches them, and passes them to the configured translator. The translator makes the HTTP call to an AI provider and returns the translations.

yapyak ships four translators: **Anthropic**, **OpenAI**, **Gemini**, and **Ollama**. Many other providers (Groq, DeepSeek, Mistral, OpenRouter, Together AI, Vercel AI Gateway) expose OpenAI-compatible APIs — point the OpenAI translator at their endpoint and you're done. For anything else, build a [custom translator](/guide/translators/custom).

```ts
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translator';

yapyak({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
})
```

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

`context` controls what data to send per `$t()` call:

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
  apiKey: '...',
  voice: 'Personal blog voice. Casual, thoughtful, never corporate. Match the original cadence.',
})
```

The voice string is prepended to every translation prompt.

## Glossary

Force specific translations for terms that must always render the same way:

```ts
anthropic({
  apiKey: '...',
  glossary: {
    'sign in': { sv: 'logga in', no: 'logg inn', dk: 'log ind' },
    'cart': { es: 'carrito', fr: 'panier', de: 'Warenkorb' },
  },
})
```

When a source string contains a glossary key, the AI uses the configured translation. For brand terms, regulated language, product vocabulary.

## When things go wrong

API calls fail. Networks drop. Providers go down. yapyak's translation layer is designed to fail gracefully.

### Automatic retries

Transient errors are retried with exponential backoff:

- Triggers on `408`, `429`, `5xx` and network-level errors
- Backoff: 250ms, 500ms, 1s, 2s, 4s, capped at 8s
- Default `maxRetries: 2` (Ollama: `1`)
- Other `4xx` errors bubble up immediately

Tune for flakier networks or stricter rate limits:

```ts
anthropic({
  apiKey: '...',
  timeout: 60_000,
  maxRetries: 5,
})
```

### After retries are exhausted

Errors are caught per batch — others keep running, failed strings logged:

```
[yapyak] translation failed: sv src/components/save-button.tsx "Save changes" Error: ...
```

Failed strings stay missing in `locales/*.json` — no partial writes. On the next save, yapyak retries them automatically because they're still missing.

### What the user sees

Nothing broken. yapyak shows the source string wherever a translation is missing:

```tsx
$t('Save changes')
// Renders as 'Save changes' in sv until the translation lands.
```

The app keeps working. No empty UI, no errors.

### Recovery

| Failure | What happens | Fix |
| --- | --- | --- |
| Single string fails | Other strings translate, that one stays source-text | Auto-retry next save |
| Whole batch fails | Other locales/batches continue | Auto-retry next save |
| Provider down | Console-warnings, app runs on source-text | Auto-retry next save |
| API key invalid | 401, warnings per stub, app runs on source-text | Fix the key, save again |
| CI build | `npx yapyak check` fails on missing translations | Translate locally first, or fix CI secret |

Translations retry on every save until the call succeeds, or until you intervene.

## Bring your own

Any LLM provider or service can be a yapyak translator. See [Custom](/guide/translators/custom) for the `createTranslator` API.
