---
title: Overview
order: 1
---

A translator is what fills the empty stubs in your locale files. When yapyak finds a new `t()` call on save, it batches the missing translations and asks your configured translator for them. The translator is a function that takes a list of source strings and target locales and returns the translations.

yapyak ships four ready-made translators that wrap a model provider's API: [Anthropic](/guide/translators/anthropic), [OpenAI](/guide/translators/openai), [Gemini](/guide/translators/gemini), and [Ollama](/guide/translators/ollama). A [custom translator](/guide/translators/custom) takes a short function for everything else.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Concise and friendly',
    glossary: { cart: { sv: 'kundvagn' } },
  }),
});
```

That's the typical shape. You add an API key, a voice, and a glossary; yapyak does the batching, retries, and result validation underneath.

## What every translator shares

The shipped translators differ in which API they talk to, but their option surface is almost identical. These options appear on all four:

| Option | Type | Default | Purpose |
|---|---|---|---|
| `apiKey` | `string` | required | Your provider key (not needed for [Ollama](/guide/translators/ollama)) |
| `model` | `string` | provider-specific | Model identifier |
| `voice` | `string` | undefined | Tone guidance, injected into the prompt |
| `glossary` | `Record<string, Record<Locale, string>>` | `{}` | Fixed translations the model can't override |
| `context` | `'none' \| 'minimal' \| 'rich'` | `'minimal'` | How much call-site code is sent along |
| `temperature` | `number` | `0.2` | Sampling temperature |
| `maxTokens` | `number` | scaled | Output token cap |
| `timeout` | `number` | `30_000` ms | Per-request timeout |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx |
| `batchSize` | `number` | `25` | Source strings per request |
| `concurrency` | `number` | `5` | Parallel requests |
| `headers` | `Record<string, string>` | `{}` | Extra HTTP headers |
| `endpoint` | `string` | provider URL | Custom API endpoint (for proxies) |

Three options reward thinking about specifically: `voice`, `glossary`, and `context`.

### Voice

A short description of how you'd like the translations to read. The model takes it as system-prompt guidance.

```ts
voice: 'Concise and friendly',
voice: 'Formal legal language',
voice: 'A casual SaaS marketing tone',
voice: 'Like a senior engineer writing release notes',
```

Voice is the single biggest knob for shaping output. A vague voice gives bland translations; a specific one gives the registered character. Keep it under a sentence — long voices tend to confuse rather than clarify.

### Glossary

Fixed translations for terms the model shouldn't second-guess. Brand names, product features, domain vocabulary.

```ts
glossary: {
  Cart: { sv: 'Korg', de: 'Warenkorb' },
  Checkout: { sv: 'Kassa', de: 'Kasse' },
  Yapyak: { sv: 'Yapyak', de: 'Yapyak' },  // don't translate the product name
},
```

Glossary terms are injected into the prompt with a strict instruction to keep them as-is. They're matched on the source string — every occurrence of "Cart" anywhere in a translatable message gets pinned to your translation. Use it for vocabulary that has to stay consistent across the whole app.

### Context

How much surrounding code yapyak sends with each translation request. Three levels:

| Level | What's sent | When to use |
|---|---|---|
| `'none'` | Just the source string | Privacy-sensitive code, costs matter |
| `'minimal'` | + component name and immediate element | Default — gives the model useful disambiguation |
| `'rich'` | + a snippet of surrounding source code | When voice and glossary aren't enough |

A higher context produces better translations for tricky strings ("Open" as button vs status) at the cost of more tokens per request. Most projects do fine with `'minimal'`.

{% callout variant="info" %}
Call-site context is sent over the same request as the source string. It goes from your machine to your provider, and nothing routes through yapyak. If your provider's terms of service worry you for any reason, `'none'` is the strict-privacy setting.
{% /callout %}

## When yapyak calls the translator

The translator runs in two situations:

**During development**, on save. When you write a new `t()` call, yapyak collects the missing strings, batches them, and calls your translator. The result is written back to your locale files; HMR refreshes the rendered text. The whole loop usually takes a few seconds.

A guardrail kicks in for large saves: when a single save adds more than [`autoTranslateThreshold`](/guide/getting-started/configuration#autotranslatethreshold) strings (default 20), yapyak holds off on auto-translating and leaves the stubs empty. You run [`yapyak translate`](/guide/cli/translate) when you're ready — useful for big refactors or agent-generated changes where you'd rather review before spending tokens.

**Through the CLI**, on demand. [`yapyak translate`](/guide/cli/translate) walks every empty stub in your locale files and runs them through your translator. Use it in CI to fill in everything that the dev-time loop didn't catch, or when you've held back auto-translation deliberately.

In both cases, only empty stubs reach the model. Existing translations stay where they are.

## When you don't need a translator

The translator is optional. Without one:

- New stubs stay empty in your locale files
- You (or a teammate) fills them in by hand, or pastes in a professional translation
- The CLI's [`status`](/guide/cli/status) and [`check`](/guide/cli/check) still work, so you can track coverage and gate CI

This is a perfectly normal pattern for teams that hand-write every translation, or for early-stage projects where one model isn't ready to make tone decisions yet.

## What yapyak protects you from

A few error cases reach the surface, mostly so you can decide whether to retry or surface them to the user:

| Error | When it fires |
|---|---|
| `TranslatorAuthError` | 401/403 — bad or missing API key |
| `TranslatorRateLimitError` | 429 — provider's rate limit; includes `retryAfter` if the provider sent one |
| `TranslatorTimeoutError` | Request exceeded `timeout` or was aborted |
| `TranslatorNetworkError` | Other HTTP failures or network errors |
| `TranslatorSafetyError` | Provider blocked content (Anthropic refusal, OpenAI content filter, Gemini SAFETY/RECITATION) |
| `TranslatorInvalidResponseError` | Model returned something that doesn't parse — unusual, but possible |
| `TranslatorTruncatedError` | Model output was cut off by the token limit |

All of them extend `TranslatorError` (importable from `yapyak/translator`), so a single `catch` block handles every case. Within a batch run, a chunk failure shows up as a [`YAP0033`](/guide/advanced/diagnostics) diagnostic — yapyak continues with the rest of the chunks and returns partial results rather than abandoning everything.

```ts
try {
  await translator.batch({ /* ... */ });
} catch (error) {
  if (error instanceof TranslatorRateLimitError) {
    await delay(error.retryAfter ?? 30_000);
  }
}
```

## Picking a provider

The four shipped translators each have their own setup page with the full options table:

- [Anthropic](/guide/translators/anthropic) — Claude models. Strong on tone and nuance.
- [OpenAI](/guide/translators/openai) — GPT and reasoning models. Works with OpenAI-compatible endpoints (Azure, Groq, Mistral, OpenRouter).
- [Gemini](/guide/translators/gemini) — Google's models. Smaller default batch size; lower latency for short messages.
- [Ollama](/guide/translators/ollama) — Local inference, no API key. Privacy-first.

None of them are wrong for general use. Pick the provider you already have a key for, or the one whose pricing fits your translation volume. You can switch later by changing one line in your config.
