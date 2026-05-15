---
title: Anthropic
order: 2
---


Use Claude (Sonnet, Opus, Haiku) as your translator.

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

Get an API key at [console.anthropic.com](https://console.anthropic.com).

## Options

```ts
interface AnthropicOptions {
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
}
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | — | Required. Set via `.env.local` (`ANTHROPIC_API_KEY`) and read via `process.env`. |
| `voice` | — | See [Voice](/guide/translators/#voice). |
| `glossary` | — | See [Glossary](/guide/translators/#glossary). |
| `context` | `'minimal'` | See [Translation context](/guide/translators/#translation-context). |
| `batchSize` | `10` | Strings per HTTP request. |
| `model` | `'claude-sonnet-4-6'` | Any Claude model. `claude-opus-4-5` for higher quality, `claude-haiku-4-5` for lower cost. |
| `temperature` | `0.2` | Low = deterministic. Recommended for translation consistency. |
| `endpoint` | `'https://api.anthropic.com/v1/messages'` | Override for private deployments or proxies. |
| `headers` | — | Extra HTTP headers. Merged after defaults. |
| `timeout` | `30_000` | Per-request timeout in milliseconds. |
| `maxRetries` | `2` | Retries on 408/429/5xx + network errors. Exponential backoff. |

## Voice example

The voice prompt heavily affects translation tone. A weak voice:

```ts
voice: 'professional'
```

Will produce generic, slightly corporate translations. A strong voice:

```ts
voice: 'Personal blog voice. Casual, thoughtful, never corporate. Use contractions. Match the original cadence — if the English is short and punchy, the translation should be too.'
```

Will produce tone-matched output. Be specific about register, formality, idioms.

## Glossary example

Forced translations for brand terms:

```ts
anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  voice: 'Casual',
  glossary: {
    'sign in':  { es: 'iniciar sesión', fr: 'se connecter', de: 'anmelden' },
    'cart':     { es: 'carrito',         fr: 'panier',       de: 'Warenkorb' },
    'shipping': { es: 'envío',           fr: 'livraison',    de: 'Versand' },
  },
})
```

Whenever the AI sees a glossary key in the source string, it's instructed to use the configured translation. Useful for brand terms, regulated language (legal, medical), or product-specific vocabulary that must render consistently across the app.

## CI

Set `ANTHROPIC_API_KEY` as a CI secret if you translate in CI. Most projects pre-translate locally and commit `locales/*.json`. See [Installation / CI](/guide/installation#ci) for both patterns.

